import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Asset3DService } from './assets3d.service';
import { CreateAsset3DDto } from './dto/create-asset3d.dto';
import { UpdateAsset3DDto } from './dto/update-asset3d.dto';
import { asset3DStorage } from '../cloudinary/cloudinary-storage';

@Controller('assets3d')
export class Asset3DController {
  constructor(private readonly asset3DService: Asset3DService) {}

  private static readonly MAX_3D_FILE_BYTES = 10 * 1024 * 1024; // 10MB max pour fichiers 3D (réduit)

  private static readonly asset3DUploadMulterOptions = {
    storage: asset3DStorage,
    limits: {
      files: 1,
      fileSize: Asset3DController.MAX_3D_FILE_BYTES,
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const ok = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'].includes(file?.mimetype) ||
                 ['.glb', '.gltf', '.obj', '.fbx', '.dae'].some(ext => file?.originalname?.toLowerCase().endsWith(ext));
      if (!ok) return cb(new BadRequestException('Format 3D non supporté (glb, gltf, obj, fbx, dae).'), false);
      return cb(null, true);
    },
  };

  @Post()
  create(@Body() dto: CreateAsset3DDto) {
    return this.asset3DService.create(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', Asset3DController.asset3DUploadMulterOptions))
  async uploadFile(
    @Body() dto: Omit<CreateAsset3DDto, 'fileUrl'>,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const createDto: CreateAsset3DDto = {
      ...dto,
      fileUrl: file.path, // Cloudinary returns the URL in file.path
    };

    return this.asset3DService.create(createDto);
  }

  @Get()
  findAll() {
    return this.asset3DService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asset3DService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAsset3DDto) {
    return this.asset3DService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asset3DService.remove(id);
  }
}
