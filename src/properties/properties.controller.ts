import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { cloudinaryStorage } from '../cloudinary/cloudinary-storage';
import { PrismaService } from "../prisma/prisma.service";
import { PropertyService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CreatePropertyWithImagesDto } from './dto/create-property-with-images.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly prisma: PrismaService,
  ) {}

  private static readonly MAX_IMAGE_BYTES =
    Number(process.env.MAX_IMAGE_BYTES) > 0
      ? Number(process.env.MAX_IMAGE_BYTES)
      : 5 * 1024 * 1024; // 5MB default

  private static readonly imageUploadMulterOptions = {
    storage: cloudinaryStorage,
    limits: {
      files: 15,
      fileSize: PropertyController.MAX_IMAGE_BYTES,
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file?.mimetype);
      if (!ok) return cb(new BadRequestException('Format image non supporté (jpg, png, webp).'), false);
      return cb(null, true);
    },
  };

  // CREATE - Route classique sans images (pour compatibilité)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertyService.create(createPropertyDto);
  }

  // CREATE WITH IMAGES - Nouvelle route unifiée
  @Post('with-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('images', 15, PropertyController.imageUploadMulterOptions))
  async createWithImages(
    @Body() createPropertyDto: CreatePropertyWithImagesDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!createPropertyDto.title || !createPropertyDto.description || createPropertyDto.price === undefined) {
      throw new BadRequestException('Les champs title, description et price sont obligatoires');
    }

    try {
      // Convertir les types pour assurer que les nombres sont corrects
      const dto: CreatePropertyDto = {
        ...createPropertyDto,
        price: Number(createPropertyDto.price),
        cityId: createPropertyDto.cityId ? Number(createPropertyDto.cityId) : undefined,
        districtId: createPropertyDto.districtId ? Number(createPropertyDto.districtId) : undefined,
        bedrooms: createPropertyDto.bedrooms ? Number(createPropertyDto.bedrooms) : undefined,
        bathrooms: createPropertyDto.bathrooms ? Number(createPropertyDto.bathrooms) : undefined,
        toilets: createPropertyDto.toilets ? Number(createPropertyDto.toilets) : undefined,
        surfaceM2: createPropertyDto.surfaceM2 ? Number(createPropertyDto.surfaceM2) : undefined,
        rooms: createPropertyDto.rooms ? Number(createPropertyDto.rooms) : undefined,
        latitude: createPropertyDto.latitude ? Number(createPropertyDto.latitude) : undefined,
        longitude: createPropertyDto.longitude ? Number(createPropertyDto.longitude) : undefined,
        features: createPropertyDto.features
          ? (Array.isArray(createPropertyDto.features)
              ? createPropertyDto.features.map(f => Number(f))
              : [])
          : undefined,
      };

      const result = await this.propertyService.createWithImages(dto, files || []);

      return {
        success: true,
        message: 'Propriété créée avec succès',
        data: result,
        imagesCount: (result?.images as any[])?.length || 0,
      };
    } catch (error) {
      console.error('Erreur lors de la création de propriété avec images:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la propriété avec images';
      throw new BadRequestException(
        errorMessage || 'Erreur lors de la création de la propriété avec images',
      );
    }
  }

  // FIND ALL
  @Get()
  findAll(@Query() filters: PropertyFilterDto, @Request() req) {
    // Récupère le rôle de l'utilisateur connecté (si présent)
    const userRole = req?.user?.role || null;
    return this.propertyService.findAll(filters, userRole);
  }


  // FIND ONE
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertyService.findOne(id);
  }

  // UPDATE
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertyService.update(id, updatePropertyDto);
  }

  // DELETE
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.propertyService.remove(id);
  }


  // LEGACY: Upload images séparément (conservé pour compatibilité)
  @Post('upload-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('images', 15, PropertyController.imageUploadMulterOptions))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('propertyId') propertyId: number,
  ) {
    if (!files || files.length === 0) {
      return { success: false, message: 'Aucun fichier reçu' };
    }

    const savedImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const img = await this.prisma.propertyImage.create({
          data: {
            url: (file as any).path ?? (file as any).secure_url ?? file.filename,
            propertyId: Number(propertyId),
            order: i,
            provider: 'cloudinary',
          },
        });

        savedImages.push(img);
      } catch (err) {
        // continue on error for individual images but log via console for now
        console.error('Erreur en sauvegardant l\'image en base :', err);
      }
    }

    return {
      success: true,
      images: savedImages,
      uploaded: files.length,
    };
  }
}
