import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeatureDto) {
    return this.prisma.feature.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.feature.findMany();
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
