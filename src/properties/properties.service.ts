// property.service.ts

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { Prisma, PropertyStatus, ListingPurpose, RentalMode } from '@prisma/client';
import { Express } from 'express';
import slugify from 'slugify';
import { DEFAULT_FEATURE_NAMES } from '../features/default-features';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  private async ensureDefaultFeaturesIfEmpty() {
    const count = await this.prisma.feature.count();
    if (count > 0) return;

    await this.prisma.feature.createMany({
      data: DEFAULT_FEATURE_NAMES.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  private async resolveExistingFeatureIds(featureIds?: number[]): Promise<number[]> {
    if (!featureIds?.length) return [];

    await this.ensureDefaultFeaturesIfEmpty();

    const uniqueIds = [...new Set(
      featureIds
        .map((featureId) => Number(featureId))
        .filter((featureId) => Number.isInteger(featureId) && featureId > 0),
    )];

    if (!uniqueIds.length) return [];

    const existingFeatures = await this.prisma.feature.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    return existingFeatures.map((feature) => feature.id);
  }

  private normalizeRentalMode(
    purpose?: ListingPurpose | null,
    rentalMode?: RentalMode | null,
  ): RentalMode | null {
    if (purpose !== ListingPurpose.LOCATION) return null;
    return rentalMode ?? RentalMode.MONTHLY;
  }

  private buildOrderBy(
    sortBy: string | undefined,
    order: 'asc' | 'desc' | undefined,
  ): Prisma.PropertyOrderByWithRelationInput {
    const direction = order ?? 'desc';

    // Whitelist of allowed sort fields to prevent column errors
    const allowedSortFields = ['createdAt', 'price', 'surfaceM2', 'bedrooms', 'bathrooms', 'toilets', 'floor', 'rooms'];

    switch (sortBy) {
      case 'recent':
        return { createdAt: direction };
      case 'price-asc':
        return { price: 'asc' };
      case 'price-desc':
        return { price: 'desc' };
      case 'surface':
        return { surfaceM2: direction };
      default:
        // For unknown sortBy or if sortBy is in allowed fields, use it safely
        if (sortBy && allowedSortFields.includes(sortBy)) {
          return { [sortBy]: direction };
        }
        return { createdAt: 'desc' };
    }
  }

  // property.service.ts (extraits)
  async create(dto: CreatePropertyDto) {
  const { cityId, districtId, images, features, assets3D, title, agentId, rentalMode, ...data } = dto;
  const validFeatureIds = await this.resolveExistingFeatureIds(features);

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
        rentalMode: this.normalizeRentalMode(data.purpose, rentalMode),
        title,
        slug: finalSlug,
        agent: agentId ? { connect: { id: agentId } } : undefined,
        city: cityId ? { connect: { id: cityId } } : undefined,
        district: districtId ? { connect: { id: districtId } } : undefined,
        toilets: dto.toilets !== undefined ? Number(dto.toilets) : undefined,

        features: validFeatureIds.length
          ? { create: validFeatureIds.map((featureId) => ({ feature: { connect: { id: featureId } } })) }
          : undefined,

        images: images?.length
          ? { create: images.map((url) => ({ url })) }
          : undefined,

        visits3D: assets3D?.length
          ? { create: assets3D.map((asset) => ({
              provider: asset.provider,
              assetUrl: asset.assetUrl,
              fileUrl: asset.fileUrl,
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

  async findAll(filters: PropertyFilterDto, userRole?: string) {
    const { page = 1, limit = 20, sortBy, order = 'desc' } = filters;
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortBy, order);

    const where = this.buildWhereClause(filters, userRole);
    const include: Prisma.PropertyInclude = {
      city: true,
      district: true,
      features: { include: { feature: true } },
      images: true,
      visits3D: true,
    };

    if (userRole === 'ADMIN') {
      include.agent = {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { page, total, totalPages: Math.ceil(total / limit), items };
  }
  

async findOne(id: number, userRole?: string) {
  const item = await this.prisma.property.findUnique({
    where: { id },
    include: {
      city: true,
      district: true,
      features: { include: { feature: true } },
      images: true,
      visits3D: true,  // <- ajout ici
      agent: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          agentProfile: {
            select: {
              companyName: true,
              bio: true,
              avatarUrl: true,
              whatsapp: true,
            },
          },
        },
      },
    },
  });
  if (!item) throw new NotFoundException(`Propriété avec ID ${id} non trouvée.`);
  const isAdmin = userRole === 'ADMIN';
  if (!isAdmin && (item.status === PropertyStatus.SOLD || item.status === PropertyStatus.RENTED)) {
    throw new NotFoundException(`Propriete avec ID ${id} non trouvee.`);
  }

  return item;
}

  async findMine(filters: PropertyFilterDto, agentId: number) {
    const { page = 1, limit = 20, sortBy, order = 'desc' } = filters;
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortBy, order);

    const baseWhere = this.buildWhereClause(filters, 'ADMIN');
    const where: Prisma.PropertyWhereInput = {
      AND: [{ agentId }, baseWhere],
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          city: true,
          district: true,
          features: { include: { feature: true } },
          images: true,
          visits3D: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { page, total, totalPages: Math.ceil(total / limit), items };
  }

async update(id: number, dto: UpdatePropertyDto) {
  const { images, features, assets3D, agentId: _agentId, rentalMode, ...data } = dto;
  const validFeatureIds = features !== undefined
    ? await this.resolveExistingFeatureIds(features)
    : undefined;

  const updateData: any = { ...data };
  let purposeForRental = dto.purpose as ListingPurpose | undefined;
  if (purposeForRental === undefined && rentalMode !== undefined) {
    const existing = await this.prisma.property.findUnique({
      where: { id },
      select: { purpose: true },
    });
    if (!existing) throw new NotFoundException(`Propriete avec ID ${id} non trouvee.`);
    purposeForRental = existing.purpose;
  }
  if (dto.purpose !== undefined || rentalMode !== undefined) {
    updateData.rentalMode = this.normalizeRentalMode(
      purposeForRental ?? undefined,
      (rentalMode as RentalMode | undefined) ?? undefined,
    );
  }
  if (dto.toilets !== undefined) {
    updateData.toilets = Number(dto.toilets);
  }

  if (features !== undefined) {
    if (features.length === 0) {
      updateData.features = { deleteMany: {} };
    } else if (validFeatureIds && validFeatureIds.length > 0) {
      updateData.features = {
        deleteMany: {},
        create: validFeatureIds.map((featureId) => ({ feature: { connect: { id: featureId } } })),
      };
    }
  }

  if (images !== undefined) {
    updateData.images = { deleteMany: {}, create: images.map((url) => ({ url })) };
  }

  if (assets3D !== undefined) {
    // Prisma relation is `visits3D` (model Asset3D[]); DTO uses `assets3D`.
    updateData.visits3D = { deleteMany: {}, create: assets3D.map((asset) => ({
      provider: asset.provider,
      assetUrl: asset.assetUrl,
      fileUrl: asset.fileUrl,
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

  private async assertAgentOwnsProperty(propertyId: number, agentId: number) {
    const prop = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, agentId: true },
    });
    if (!prop) throw new NotFoundException(`Propriété avec ID ${propertyId} non trouvée.`);
    if (!prop.agentId || prop.agentId !== agentId) {
      throw new ForbiddenException("Vous ne pouvez modifier que les biens que vous avez créés.");
    }
  }

  async updateForActor(id: number, dto: UpdatePropertyDto, actor: { id: number; role: string }) {
    if (actor.role === 'AGENT') {
      await this.assertAgentOwnsProperty(id, actor.id);
    }
    return this.update(id, dto);
  }

  // -------------------------------------------------------------------

  // --- CREATE WITH IMAGES (Transaction) ---
  async createWithImages(
    dto: CreatePropertyDto,
    files: Express.Multer.File[],
  ) {
    const { cityId, districtId, features, assets3D, title, images, agentId, rentalMode, ...data } = dto;
    const validFeatureIds = await this.resolveExistingFeatureIds(features);

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
          rentalMode: this.normalizeRentalMode(data.purpose, rentalMode),
          title,
          slug: finalSlug,
          agent: agentId ? { connect: { id: agentId } } : undefined,
          city: cityId ? { connect: { id: cityId } } : undefined,
          district: districtId ? { connect: { id: districtId } } : undefined,
          features: validFeatureIds.length
            ? { create: validFeatureIds.map((featureId) => ({ feature: { connect: { id: featureId } } })) }
            : undefined,
          images: images?.length
            ? {
                create: images.map((url, index) => ({
                  url,
                  order: index,
                  provider: 'external',
                })),
              }
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
                order: (images?.length ?? 0) + index,
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

  // --- CREATE/UPLOAD IMAGES UTILITIES ---

  async addImages(
    propertyId: number,
    files: Express.Multer.File[],
    actor?: { id: number; role: string },
  ) {
    if (!files || files.length === 0) {
      return { success: false, images: [], uploaded: 0 };
    }

    if (actor?.role === 'AGENT') {
      await this.assertAgentOwnsProperty(propertyId, actor.id);
    }

    const savedImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const img = await this.prisma.propertyImage.create({
          data: {
            url: (file as any).path ?? (file as any).secure_url ?? file.filename,
            propertyId,
            order: i,
            provider: 'cloudinary',
          },
        });
        savedImages.push(img);
      } catch (err) {
        // On continue pour les fichiers suivants mais on log l'erreur
        // pour pouvoir la diagnostiquer.
        // eslint-disable-next-line no-console
        console.error("Erreur en sauvegardant l'image en base :", err);
      }
    }

    return {
      success: true,
      images: savedImages,
      uploaded: files.length,
    };
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

  async removeForActor(id: number, actor: { id: number; role: string }) {
    if (actor.role === 'AGENT') {
      await this.assertAgentOwnsProperty(id, actor.id);
    }
    return this.remove(id);
  }

  private buildWhereClause(filters: PropertyFilterDto, userRole?: string): Prisma.PropertyWhereInput {
    const {
      minPrice, maxPrice, type, purpose, rentalMode, status, cityId, districtIds,
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
    if (rentalMode) where.rentalMode = rentalMode;

    const isAdmin = userRole === 'ADMIN';

    if (status) {
      where.status = status;
    } else if (!isAdmin) {
      // Si pas admin, on masque les biens loués ou vendus
      where.status = { notIn: [PropertyStatus.RENTED, PropertyStatus.SOLD] };
    }

    if (!isAdmin && status) {
      // Interdit de recuperer des biens vendus/loues via le filtre `status`.
      where.AND = [
        ...(where.AND
          ? Array.isArray(where.AND)
            ? where.AND
            : [where.AND]
          : []),
        { status: { notIn: [PropertyStatus.RENTED, PropertyStatus.SOLD] } },
      ];
    }

    if (cityId) where.cityId = typeof cityId === 'string' ? Number(cityId) : cityId;
    if (filters.districtIds && filters.districtIds.length > 0) {
      where.districtId = { in: filters.districtIds };
    }

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
