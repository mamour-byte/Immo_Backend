import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyAgentDto } from './dto/apply-agent.dto';
import * as bcrypt from 'bcryptjs';
import { AgentApplicationStatus, AgentProfileType, Role } from '@prisma/client';
import { UpdateAgentApplicationDto } from './dto/update-agent-application.dto';
import { Resend } from 'resend';
import { ApplyAgentFullDto } from './dto/apply-agent-full.dto';

@Injectable()
export class AgentApplicationsService {
  private readonly logger = new Logger(AgentApplicationsService.name);
  private resend: Resend;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY n'est pas défini. Les emails ne seront pas envoyés.");
    }
    this.resend = new Resend(apiKey);
  }

  private async sendDecisionEmail(args: {
    to: string;
    status: AgentApplicationStatus;
    decisionNote?: string | null;
  }) {
    const from = process.env.MAIL_FROM || 'Ethic Immobilier <onboarding@resend.dev>';
    const subject =
      args.status === AgentApplicationStatus.APPROVED
        ? 'Votre demande de compte agent a été acceptée'
        : 'Votre demande de compte agent a été refusée';

    const notePart = args.decisionNote ? `\n\nMessage de l'admin :\n${args.decisionNote}` : '';

    const text =
      args.status === AgentApplicationStatus.APPROVED
        ? `Bonjour,\n\nVotre demande de compte agent a été acceptée. Vous pouvez maintenant vous connecter et accéder au tableau de bord.${notePart}\n\nCordialement,\nEthic Immobilier`
        : `Bonjour,\n\nVotre demande de compte agent a été refusée.${notePart}\n\nSi vous pensez qu'il s'agit d'une erreur, vous pouvez répondre à cet email.\n\nCordialement,\nEthic Immobilier`;

    try {
      const response = await this.resend.emails.send({
        from,
        to: args.to,
        subject,
        text,
      });
      this.logger.log(`Decision email sent: ${JSON.stringify(response)}`);
    } catch (error: any) {
      this.logger.error("Erreur lors de l'envoi de l'email de décision", error?.stack ?? error);
    }
  }

  private getUploadedUrl(file?: Express.Multer.File) {
    if (!file) return undefined;
    return ((file as any).path ?? (file as any).secure_url ?? file.filename) as string;
  }

  async applyFull(
    dto: ApplyAgentFullDto,
    files: {
      profilePhoto?: Express.Multer.File[];
      idDocument?: Express.Multer.File[];
      tradeRegister?: Express.Multer.File[];
      professionalCard?: Express.Multer.File[];
      agencyLogo?: Express.Multer.File[];
      agencyPhoto?: Express.Multer.File[];
    },
  ) {
    if (!dto.acceptedTerms) throw new BadRequestException("Vous devez accepter les conditions d'utilisation.");
    if (!dto.certifiedTrue) throw new BadRequestException("Vous devez certifier que les informations sont exactes.");
    if (!Array.isArray(dto.languages) || dto.languages.length === 0) throw new BadRequestException("Langues parlées requises.");
    if (dto.yearsExperience === undefined) throw new BadRequestException("Années d'expérience requises.");
    if (!dto.activityZone?.trim()) throw new BadRequestException("Zone d'activité requise.");
    if (dto.managedPropertiesCount === undefined) throw new BadRequestException("Nombre de biens gérés requis.");

    const profilePhotoUrl = this.getUploadedUrl(files?.profilePhoto?.[0]);
    const idDocumentUrl = this.getUploadedUrl(files?.idDocument?.[0]);
    const tradeRegisterUrl = this.getUploadedUrl(files?.tradeRegister?.[0]);
    const professionalCardUrl = this.getUploadedUrl(files?.professionalCard?.[0]);
    const agencyLogoUrl = this.getUploadedUrl(files?.agencyLogo?.[0]);
    const agencyPhotoUrl = this.getUploadedUrl(files?.agencyPhoto?.[0]);

    if (!profilePhotoUrl) throw new BadRequestException('Photo de profil requise.');
    if (!idDocumentUrl) throw new BadRequestException("Pièce d'identité requise.");

    const isAgency = dto.profileType === AgentProfileType.AGENCY;
    const needsOrgName = dto.profileType === AgentProfileType.AGENCY || dto.profileType === AgentProfileType.DEVELOPER;

    if (needsOrgName && !dto.agencyName?.trim()) {
      throw new BadRequestException("Nom de l'agence / société requis.");
    }

    if (isAgency) {
      if (!tradeRegisterUrl) throw new BadRequestException('Registre de commerce requis pour une agence.');
      if (!agencyLogoUrl) throw new BadRequestException("Logo de l'agence requis.");
      if (!agencyPhotoUrl) throw new BadRequestException("Photo de l'agence requise.");
    }

    const exist = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (exist) {
      throw new ConflictException("Un utilisateur avec cet email existe déjà. Connectez-vous puis faites la demande.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName,
          phone: dto.phone,
          role: Role.USER,
        },
        select: { id: true, email: true },
      });

      const application = await tx.agentApplication.create({
        data: {
          userId: user.id,
          status: AgentApplicationStatus.PENDING,

          firstName: dto.firstName,
          lastName: dto.lastName,
          city: dto.city,
          address: dto.address,
          profilePhotoUrl,
          profileType: dto.profileType,

          agencyName: dto.agencyName,
          yearsExperience: dto.yearsExperience,
          activityZone: dto.activityZone,
          managedPropertiesCount: dto.managedPropertiesCount,
          websiteUrl: dto.websiteUrl,
          facebookUrl: dto.facebookUrl,

          whatsapp: dto.whatsapp,
          publicPhone: dto.publicPhone,
          languages: dto.languages,
          publicDescription: dto.publicDescription,

          idDocumentUrl,
          tradeRegisterUrl,
          professionalCardUrl,

          agencyLogoUrl,
          agencyAddress: dto.address,
          agencyPhotoUrl,

          acceptedTerms: dto.acceptedTerms,
          certifiedTrue: dto.certifiedTrue,

          // Backward-compatible mirrors for existing UI
          companyName: dto.agencyName,
          bio: dto.publicDescription,
          avatarUrl: profilePhotoUrl,
        },
        select: { id: true, status: true, submittedAt: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AGENT_APPLICATION_SUBMITTED',
          meta: { applicationId: application.id },
        },
      });

      return { user, application };
    });

    return {
      success: true,
      message: 'Demande envoyée. Un admin va étudier votre dossier.',
      application: created.application,
    };
  }

  async apply(dto: ApplyAgentDto) {
    const exist = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (exist) {
      throw new ConflictException("Un utilisateur avec cet email existe déjà. Connectez-vous puis faites la demande.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: Role.USER,
        },
        select: { id: true, email: true },
      });

      const application = await tx.agentApplication.create({
        data: {
          userId: user.id,
          companyName: dto.companyName,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
          whatsapp: dto.whatsapp,
          status: AgentApplicationStatus.PENDING,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AGENT_APPLICATION_SUBMITTED',
          meta: { applicationId: application.id },
        },
      });

      return { user, application };
    });

    return {
      success: true,
      message: 'Demande envoyée. Un admin va étudier votre dossier.',
      application: created.application,
    };
  }

  async applyForExistingUser(userId: number, dto: UpdateAgentApplicationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const existing = await this.prisma.agentApplication.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Une demande agent existe déjà pour ce compte.');
    }

    const application = await this.prisma.$transaction(async (tx) => {
      if (dto.fullName !== undefined || dto.phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { fullName: dto.fullName, phone: dto.phone },
        });
      }

      const app = await tx.agentApplication.create({
        data: {
          userId,
          companyName: dto.companyName,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
          whatsapp: dto.whatsapp,
          status: AgentApplicationStatus.PENDING,
        },
        select: { id: true, status: true, submittedAt: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'AGENT_APPLICATION_SUBMITTED',
          meta: { applicationId: app.id },
        },
      });

      return app;
    });

    return {
      success: true,
      message: 'Demande envoyée. Un admin va étudier votre dossier.',
      application,
    };
  }

  async getMine(userId: number) {
    const app = await this.prisma.agentApplication.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, role: true } },
      },
    });
    if (!app) throw new NotFoundException("Aucune demande agent pour cet utilisateur.");
    return app;
  }

  async updateMine(userId: number, dto: UpdateAgentApplicationDto) {
    const existing = await this.prisma.agentApplication.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("Aucune demande agent pour cet utilisateur.");
    if (existing.status !== AgentApplicationStatus.PENDING) {
      throw new BadRequestException("Impossible de modifier une demande déjà traitée.");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.fullName !== undefined || dto.phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { fullName: dto.fullName, phone: dto.phone },
        });
      }

      return tx.agentApplication.update({
        where: { userId },
        data: {
          companyName: dto.companyName,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
          whatsapp: dto.whatsapp,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true, role: true } },
        },
      });
    });

    return updated;
  }

  async list(status?: AgentApplicationStatus) {
    return this.prisma.agentApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, role: true } },
      },
    });
  }

  async approve(applicationId: number, adminId: number, decisionNote?: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.agentApplication.findUnique({
        where: { id: applicationId },
        include: { user: { select: { id: true, email: true, role: true } } },
      });
      if (!app) throw new NotFoundException('Demande introuvable');
      if (app.status !== AgentApplicationStatus.PENDING) {
        throw new BadRequestException('Demande déjà traitée');
      }

      const result = await tx.agentApplication.update({
        where: { id: applicationId },
        data: {
          status: AgentApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: adminId,
          decisionNote,
        },
        include: { user: { select: { id: true, email: true } } },
      });

      await tx.user.update({
        where: { id: app.user.id },
        data: { role: Role.AGENT },
      });

      const existingProfile = await tx.agentProfile.findUnique({ where: { userId: app.user.id }, select: { id: true } });
      if (!existingProfile) {
        await tx.agentProfile.create({
          data: {
            userId: app.user.id,
            companyName: app.companyName ?? undefined,
            bio: app.bio ?? undefined,
            avatarUrl: app.avatarUrl ?? undefined,
            whatsapp: app.whatsapp ?? undefined,
          },
        });
      } else if (app.whatsapp) {
        await tx.agentProfile.update({
          where: { userId: app.user.id },
          data: { whatsapp: app.whatsapp },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'AGENT_APPLICATION_APPROVED',
          meta: { applicationId, userId: app.user.id },
        },
      });

      return result;
    });

    await this.sendDecisionEmail({
      to: updated.user.email,
      status: AgentApplicationStatus.APPROVED,
      decisionNote,
    });

    return updated;
  }

  async reject(applicationId: number, adminId: number, decisionNote?: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.agentApplication.findUnique({
        where: { id: applicationId },
        include: { user: { select: { id: true, email: true } } },
      });
      if (!app) throw new NotFoundException('Demande introuvable');
      if (app.status !== AgentApplicationStatus.PENDING) {
        throw new BadRequestException('Demande déjà traitée');
      }

      const result = await tx.agentApplication.update({
        where: { id: applicationId },
        data: {
          status: AgentApplicationStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: adminId,
          decisionNote,
        },
        include: { user: { select: { id: true, email: true } } },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'AGENT_APPLICATION_REJECTED',
          meta: { applicationId, userId: app.user.id },
        },
      });

      return result;
    });

    await this.sendDecisionEmail({
      to: updated.user.email,
      status: AgentApplicationStatus.REJECTED,
      decisionNote,
    });

    return updated;
  }
}
