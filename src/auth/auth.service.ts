import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UpdateMeDto } from './dto/update-me.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend: Resend | null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY n'est pas défini. Les emails de réinitialisation ne seront pas envoyés.");
      this.resend = null;
      return;
    }

    this.resend = new Resend(apiKey);
  }

  private sanitizeUser(user: any) {
    if (!user) return user;
    // Never expose passwordHash (or other sensitive columns) to clients
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return safe;
  }

  private getPasswordResetTtlMinutes() {
    const rawValue = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES;
    const parsed = rawValue ? Number(rawValue) : NaN;

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return 60;
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getPasswordResetUrl(token: string) {
    const frontendUrl =
      process.env.PASSWORD_RESET_URL ||
      (process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/reset-password`
        : 'http://localhost:5173/reset-password');

    const url = new URL(frontendUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private async sendPasswordResetEmail(args: {
    to: string;
    fullName?: string | null;
    resetUrl: string;
    ttlMinutes: number;
  }) {
    if (!this.resend) {
      this.logger.warn(`Email non envoyé faute de configuration Resend. Lien de reset: ${args.resetUrl}`);
      return;
    }

    const from = process.env.MAIL_FROM || 'Ethic Immobilier <onboarding@resend.dev>';
    const greeting = args.fullName?.trim() ? `Bonjour ${args.fullName},` : 'Bonjour,';
    const ttlLabel = `${args.ttlMinutes} minute${args.ttlMinutes > 1 ? 's' : ''}`;

    await this.resend.emails.send({
      from,
      to: args.to,
      subject: 'Réinitialisation de votre mot de passe',
      text: [
        greeting,
        '',
        "Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Ethic Immobilier.",
        `Utilisez ce lien dans les ${ttlLabel} :`,
        args.resetUrl,
        '',
        "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.",
      ].join('\n'),
    });
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        fullName: true,
        isSuspended: true,
      },
    });

    const successMessage =
      "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.";

    if (!user || user.isSuspended) {
      return { message: successMessage };
    }

    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(plainToken);
    const ttlMinutes = this.getPasswordResetTtlMinutes();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const resetUrl = this.getPasswordResetUrl(plainToken);

    try {
      await this.sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
        ttlMinutes,
      });
    } catch (error: any) {
      this.logger.error(
        "Erreur lors de l'envoi de l'email de réinitialisation",
        error?.stack ?? error,
      );
      throw new BadRequestException(
        "Impossible d'envoyer l'email de réinitialisation pour le moment.",
      );
    }

    return { message: successMessage };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.user.id,
          id: { not: resetToken.id },
        },
      }),
    ]);

    return { message: 'Votre mot de passe a été réinitialisé avec succès.' };
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
