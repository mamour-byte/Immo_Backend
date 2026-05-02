import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { CreateContactDto } from './dto/create-contact.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private resend: Resend;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured. Email delivery will be skipped.');
    }
    this.resend = new Resend(apiKey);
  }

  async sendContactEmail(dto: CreateContactDto) {
    const { name, email, phone, message, propertyId, channel } = dto;
    const channelLabel = channel || 'FORM';

    const savedMessage = await this.prisma.message.create({
      data: {
        senderName: name,
        senderEmail: email,
        senderPhone: phone,
        propertyId,
        body: `[${channelLabel}] ${message}`,
      },
    });

    if (propertyId) {
      await this.prisma.propertyStat.upsert({
        where: { propertyId },
        create: { propertyId, contacts: 1 },
        update: { contacts: { increment: 1 } },
      });
    }

    const property = propertyId
      ? await this.prisma.property.findUnique({
          where: { id: propertyId },
          select: {
            id: true,
            title: true,
            city: { select: { name: true } },
            district: { select: { name: true } },
          },
        })
      : null;

    const propertyLabel = property
      ? `#${property.id} - ${property.title} (${[property.city?.name, property.district?.name]
          .filter(Boolean)
          .join(', ') || 'Localisation non specifiee'})`
      : propertyId ?? 'Non specifie';

    const emailBody = [
      'Nouvelle demande de bien',
      '',
      `Canal : ${channelLabel}`,
      `Nom : ${name}`,
      `Email : ${email}`,
      `Telephone : ${phone ?? 'Non specifie'}`,
      '',
      'Message :',
      message,
      '',
      `Bien concerne : ${propertyLabel}`,
    ].join('\n');

    if (channelLabel === 'WHATSAPP') {
      return { success: true, message: 'Demande WhatsApp enregistree', emailSent: false, savedMessage };
    }

    try {
      const to = process.env.AGENCY_EMAIL;
      if (!to) {
        this.logger.warn('AGENCY_EMAIL is not configured.');
        return { success: true, message: 'Demande enregistree', emailSent: false, savedMessage };
      }

      const response = await this.resend.emails.send({
        from: 'Ethic Immobilier <onboarding@resend.dev>',
        to,
        subject: `Nouvelle demande de bien - ${name}`,
        text: emailBody,
      });

      return {
        success: true,
        message: 'Demande enregistree et email envoye',
        emailSent: true,
        response,
        savedMessage,
      };
    } catch (error: any) {
      this.logger.error('Erreur lors de l\'envoi de l\'email', error?.stack ?? error);
      return {
        success: true,
        message: 'Demande enregistree, email non envoye',
        emailSent: false,
        emailError: error?.message ?? String(error),
        savedMessage,
      };
    }
  }
}
