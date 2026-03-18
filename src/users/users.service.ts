import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        createdAt: true,
        updatedAt: true,
        agentProfile: true,
        agentApplication: true,
        _count: {
          select: {
            favorites: true,
            appointmentsAsUser: true,
            appointmentsAsAgent: true,
            properties: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException("Utilisateur introuvable");
    return user;
  }

  async create(dto: CreateUserDto) {
    const exist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exist) {
      throw new ConflictException("Cet email est déjà utilisé");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
      },
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException("Utilisateur introuvable");
    if (dto.isSuspended !== undefined && user.role === 'ADMIN') {
      throw new ForbiddenException("Impossible de suspendre un admin");
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const suspendData =
      dto.isSuspended === undefined
        ? {}
        : {
            isSuspended: dto.isSuspended,
            suspendedAt: dto.isSuspended ? new Date() : null,
          };

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        ...suspendData,
      },
    });
  }

  async delete(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");
    if (user.role === 'ADMIN') throw new ForbiddenException("Impossible de supprimer un admin");

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Keep deletes safe across environments where FK rules may be RESTRICT.
        await tx.favorite.deleteMany({ where: { userId: id } });
        await tx.appointment.deleteMany({ where: { userId: id } });
        await tx.agentProfile.deleteMany({ where: { userId: id } });
        await tx.agentApplication.deleteMany({ where: { userId: id } });

        // Defensive clean-up for optional agent relations.
        await tx.property.updateMany({ where: { agentId: id }, data: { agentId: null } });
        await tx.appointment.updateMany({ where: { agentId: id }, data: { agentId: null } });
        await tx.message.updateMany({ where: { userId: id }, data: { userId: null } });
        await tx.auditLog.updateMany({ where: { actorId: id }, data: { actorId: null } });

        return tx.user.delete({ where: { id } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          "Suppression impossible: cet utilisateur est encore lie a des donnees dependantes.",
        );
      }
      throw error;
    }
  }
}
