// property-image.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyImageDto } from './dto/create-property-image.dto';
import { UpdatePropertyImageDto } from './dto/update-property-image.dto';

@Injectable()
export class PropertyImageService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePropertyImageDto) {
    return this.prisma.propertyImage.create({
      data: { ...dto },
    });
  }

  async findAll(propertyId?: number) {
    return this.prisma.propertyImage.findMany({
      where: propertyId ? { propertyId } : {},
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: number) {
    const image = await this.prisma.propertyImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException(`Image ID ${id} non trouvée`);
    return image;
  }

  async update(id: number, dto: UpdatePropertyImageDto) {
    try {
      return await this.prisma.propertyImage.update({
        where: { id },
        data: { ...dto },
      });
    } catch {
      throw new NotFoundException(`Image ID ${id} non trouvée`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.propertyImage.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Image ID ${id} non trouvée`);
    }
  }
}
