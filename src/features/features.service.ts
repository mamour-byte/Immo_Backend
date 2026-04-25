import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { DEFAULT_FEATURE_NAMES } from './default-features';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  private async ensureDefaultsIfEmpty() {
    const count = await this.prisma.feature.count();
    if (count > 0) return;

    await this.prisma.feature.createMany({
      data: DEFAULT_FEATURE_NAMES.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  async create(dto: CreateFeatureDto) {
    return this.prisma.feature.create({
      data: dto,
    });
  }

  async findAll() {
    await this.ensureDefaultsIfEmpty();
    return this.prisma.feature.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const feature = await this.prisma.feature.findUnique({ where: { id } });
    if (!feature) throw new NotFoundException('Feature not found');
    return feature;
  }

  async update(id: number, dto: UpdateFeatureDto) {
    return this.prisma.feature.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // vérification existence
    return this.prisma.feature.delete({ where: { id } });
  }
}
