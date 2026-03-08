import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCityDto) {
    return this.prisma.city.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.city.findMany({
      include: {
        districts: true,
      },
    });
  }

  async findOne(id: number) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        districts: true,
      },
    });

    if (!city) throw new NotFoundException('City not found');

    return city;
  }

  async update(id: number, dto: UpdateCityDto) {
    return this.prisma.city.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.city.delete({
      where: { id },
    });
  }
}
