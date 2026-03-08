// property.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import {  Prisma } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  // property.service.ts (extraits)
async create(dto: CreatePropertyDto) {
  const { cityId, districtId, images, features, assets3D, title, ...data } = dto;

  const slug = slugify(title, { lower: true, strict: true, locale: 'fr' });

    // Gérer collision de slug en ajoutant un suffixe incrémental
    let finalSlug = slug;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await this.prisma.property.findUnique({ where: { slug: finalSlug }, select: { id: true } });
      if (!exists) break;
      finalSlug = `${slug}-${suffix++}`;
    }

    return this.prisma.property.create({
      data: {
        ...data,
        title,
        slug: finalSlug,
        city: cityId ? { connect: { id: cityId } } : undefined,
        district: districtId ? { connect: { id: districtId } } : undefined,
        toilets: dto.toilets !== undefined ? Number(dto.toilets) : undefined,

        features: features?.length
          ? { create: features.map((featureId) => ({ feature: { connect: { id: featureId } } })) }
          : undefined,

        images: images?.length
          ? { create: images.map((url) => ({ url })) }
          : undefined,

        visits3D: assets3D?.length
          ? { create: assets3D.map((asset) => ({
              provider: asset.provider,
              assetUrl: asset.assetUrl,
              title: asset.title,
              thumbnail: asset.thumbnail
            })) }
          : undefined,
      },
      include: {
        city: true,
        district: true,
        features: { include: { feature: true } },
        images: true,
        visits3D: true,
      },
    });
}

async findAll(filters: PropertyFilterDto) {
  const { page = 1, limit = 20, sortBy, order = 'desc' } = filters;
  const skip = (page - 1) * limit;

  // Construire l'orderBy selon le sortBy
  let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: 'desc' };
  
  if (sortBy) {
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: order as 'asc' | 'desc' };
        break;
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'surface':
        orderBy = { surfaceM2: order as 'asc' | 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
  }

  const [items, total] = await Promise.all([
    this.prisma.property.findMany({
      where: this.buildWhereClause(filters),
      include: {
        city: true,
        district: true,
        features: { include: { feature: true } },
        images: true,
        visits3D: true,  // <- ajout ici
      },
      skip,
      take: limit,
      orderBy,
    }),
    this.prisma.property.count({ where: this.buildWhereClause(filters) }),
  ]);

  return { page, total, totalPages: Math.ceil(total / limit), items };
}
  

async findOne(id: number) {
  const item = await this.prisma.property.findUnique({
    where: { id },
    include: {
      city: true,
      district: true,
      features: { include: { feature: true } },
      images: true,
      visits3D: true,  // <- ajout ici
    },
  });
  if (!item) throw new NotFoundException(`Propriété avec ID ${id} non trouvée.`);
  return item;
}

async update(id: number, dto: UpdatePropertyDto) {
  const { images, features, assets3D, ...data } = dto;

  const updateData: any = { ...data };
  if (dto.toilets !== undefined) {
    updateData.toilets = Number(dto.toilets);
  }

  if (features !== undefined) {
    updateData.features = {
      deleteMany: {},
      create: features.map((featureId) => ({ feature: { connect: { id: featureId } } })),
    };
  }

  if (images !== undefined) {
    updateData.images = { deleteMany: {}, create: images.map((url) => ({ url })) };
  }

  if (assets3D !== undefined) {
    updateData.assets3D = { deleteMany: {}, create: assets3D.map((asset) => ({
      provider: asset.provider,
      assetUrl: asset.assetUrl,
      title: asset.title,
      thumbnail: asset.thumbnail,
    })) };
  }

  return this.prisma.property.update({
    where: { id },
    data: updateData,
    include: {
      city: true,
      district: true,
      features: { include: { feature: true } },
      images: true,
      visits3D: true, // <- ajout ici
    },
  });
}

  // -------------------------------------------------------------------

  // --- CREATE WITH IMAGES (Transaction) ---
  async createWithImages(
    dto: CreatePropertyDto,
    files: Express.Multer.File[],
  ) {
    const { cityId, districtId, features, assets3D, title, images, ...data } = dto;

    const slug = slugify(title, { lower: true, strict: true, locale: 'fr' });

    // Gérer collision de slug en ajoutant un suffixe incrémental
    let finalSlug = slug;
    let suffix = 1;
    while (true) {
      const exists = await this.prisma.property.findUnique({ where: { slug: finalSlug }, select: { id: true } });
      if (!exists) break;
      finalSlug = `${slug}-${suffix++}`;
    }

    // Créer la propriété ET les images en une transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Créer la propriété
      const property = await tx.property.create({
        data: {
          ...data,
          title,
          slug: finalSlug,
          city: cityId ? { connect: { id: cityId } } : undefined,
          district: districtId ? { connect: { id: districtId } } : undefined,
          features: features?.length
            ? { create: features.map((featureId) => ({ feature: { connect: { id: featureId } } })) }
            : undefined,
          visits3D: assets3D?.length
            ? { create: assets3D.map((asset) => ({
                provider: asset.provider,
                assetUrl: asset.assetUrl,
                title: asset.title,
                thumbnail: asset.thumbnail
              })) }
            : undefined,
        },
        include: {
          city: true,
          district: true,
          features: { include: { feature: true } },
          images: true,
          visits3D: true,
        },
      });

      // 2. Uploader les images si présentes
      if (files && files.length > 0) {
        await Promise.all(
          files.map((file, index) =>
            tx.propertyImage.create({
              data: {
                url: (file as any).path ?? (file as any).secure_url ?? file.filename,
                propertyId: property.id,
                order: index,
                provider: 'cloudinary',
              },
            }),
          ),
        );
        // Récupérer les images mises à jour
        const updatedProperty = await tx.property.findUnique({
          where: { id: property.id },
          include: {
            city: true,
            district: true,
            features: { include: { feature: true } },
            images: true,
            visits3D: true,
          },
        });
        return updatedProperty;
      }

      return property;
    });
  }

  // --- REMOVE ---
  
  async remove(id: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Supprimer les dépendances pour éviter les contraintes FK
        await tx.propertyImage.deleteMany({ where: { propertyId: id } });
        await tx.propertyFeature.deleteMany({ where: { propertyId: id } });
        await tx.favorite.deleteMany({ where: { propertyId: id } });
        await tx.appointment.deleteMany({ where: { propertyId: id } });
        await tx.asset3D.deleteMany({ where: { propertyId: id } });
        await tx.propertyStat.deleteMany({ where: { propertyId: id } });
        await tx.message.deleteMany({ where: { propertyId: id } });

        return tx.property.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Propriété avec ID ${id} non trouvée.`);
      }
      throw error;
    }
  }

  private buildWhereClause(filters: PropertyFilterDto): Prisma.PropertyWhereInput {
    const {
      minPrice, maxPrice, type, purpose, status, cityId, districtId,
      bedrooms, bathrooms, minSurface, maxSurface, features, search,
    } = filters;

    const where: Prisma.PropertyWhereInput = {};

    // Conversion explicite en nombres pour garantir le type
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = typeof minPrice === 'string' ? Number(minPrice) : minPrice;
      if (maxPrice) where.price.lte = typeof maxPrice === 'string' ? Number(maxPrice) : maxPrice;
    }

    if (type) where.type = type;
    if (purpose) where.purpose = purpose;
    if (status) where.status = status;

    if (cityId) where.cityId = typeof cityId === 'string' ? Number(cityId) : cityId;
    if (districtId) where.districtId = typeof districtId === 'string' ? Number(districtId) : districtId;

    // Utiliser gte (greater than or equal) pour "au moins X" chambres/salles de bains
    if (bedrooms) {
      const bedroomsNum = typeof bedrooms === 'string' ? Number(bedrooms) : bedrooms;
      where.bedrooms = { gte: bedroomsNum };
    }
    if (bathrooms) {
      const bathroomsNum = typeof bathrooms === 'string' ? Number(bathrooms) : bathrooms;
      where.bathrooms = { gte: bathroomsNum };
    }

    if (minSurface || maxSurface) {
      where.surfaceM2 = {};
      if (minSurface) where.surfaceM2.gte = typeof minSurface === 'string' ? Number(minSurface) : minSurface;
      if (maxSurface) where.surfaceM2.lte = typeof maxSurface === 'string' ? Number(maxSurface) : maxSurface;
    }

    if (features && features.length > 0) {
      where.features = {
        some: {
          featureId: { in: features },
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  

}