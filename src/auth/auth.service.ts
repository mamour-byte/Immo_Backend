import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  private sanitizeUser(user: any) {
    if (!user) return user;
    // Never expose passwordHash (or other sensitive columns) to clients
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async register(dto: RegisterDto) {
    const exist = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (exist) {
      throw new ConflictException("Un utilisateur avec cet email existe déjà.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
      }
    });

    return this.generateToken(this.sanitizeUser(user));
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        phone: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException("Identifiants incorrects");
    if (user.isSuspended) throw new UnauthorizedException("Compte suspendu");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Identifiants incorrects");

    return this.generateToken(this.sanitizeUser(user));
  }

  generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: this.sanitizeUser(user)
    };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        agentProfile: true,
        agentApplication: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.sanitizeUser(user);
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, agentProfile: { select: { id: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
        },
      });

      if (
        dto.companyName !== undefined ||
        dto.bio !== undefined ||
        dto.avatarUrl !== undefined ||
        dto.whatsapp !== undefined
      ) {
        await tx.agentProfile.upsert({
          where: { userId },
          create: {
            userId,
            companyName: dto.companyName,
            bio: dto.bio,
            avatarUrl: dto.avatarUrl,
            whatsapp: dto.whatsapp,
          },
          update: {
            companyName: dto.companyName,
            bio: dto.bio,
            avatarUrl: dto.avatarUrl,
            whatsapp: dto.whatsapp,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          agentProfile: true,
          agentApplication: true,
        },
      });
    });

    return this.sanitizeUser(updated);
  }
}
