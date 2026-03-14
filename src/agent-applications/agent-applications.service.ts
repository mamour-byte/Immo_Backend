import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyAgentDto } from './dto/apply-agent.dto';
import * as bcrypt from 'bcryptjs';
import { AgentApplicationStatus, Role } from '@prisma/client';
import { UpdateAgentApplicationDto } from './dto/update-agent-application.dto';
import { Resend } from 'resend';

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
          },
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
