import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAsset3DDto } from './dto/create-asset3d.dto';
import { UpdateAsset3DDto } from './dto/update-asset3d.dto';

@Injectable()
export class Asset3DService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAsset3DDto) {
    return this.prisma.asset3D.create({
      data: dto,
      include: { property: true },
    });
  }

  async findAll() {
    return this.prisma.asset3D.findMany({
      include: { property: true },
    });
  }

  async findOne(id: number) {
    const asset = await this.prisma.asset3D.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!asset) throw new NotFoundException(`Asset3D avec ID ${id} non trouvé`);
    return asset;
  }

  async update(id: number, dto: UpdateAsset3DDto) {
    try {
      return await this.prisma.asset3D.update({
        where: { id },
        data: dto,
        include: { property: true },
      });
    } catch (err) {
      throw new NotFoundException(`Asset3D avec ID ${id} non trouvé`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.asset3D.delete({ where: { id } });
    } catch (err) {
      throw new NotFoundException(`Asset3D avec ID ${id} non trouvé`);
    }
  }
}
