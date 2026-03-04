import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

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
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException("Identifiants incorrects");

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
}
