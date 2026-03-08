import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';

@Injectable()
export class DistrictsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDistrictDto) {
    return this.prisma.district.create({
      data: {
        name: dto.name,
        city: { connect: { id: dto.cityId } },
      },
    });
  }

  async findAll() {
    return this.prisma.district.findMany({
      include: { city: true },
    });
  }

  async findOne(id: number) {
    const district = await this.prisma.district.findUnique({
      where: { id },
      include: { city: true },
    });
    if (!district) throw new NotFoundException('District not found');
    return district;
  }

  async update(id: number, dto: UpdateDistrictDto) {
    return this.prisma.district.update({
      where: { id },
      data: {
        name: dto.name,
        city: dto.cityId ? { connect: { id: dto.cityId } } : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.district.delete({ where: { id } });
  }
}
