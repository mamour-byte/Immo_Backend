import { Injectable, Logger } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { Resend } from 'resend';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY n\'est pas défini. Les envois d\'emails échoueront.');
    }
    this.resend = new Resend(apiKey);
  }

  async sendContactEmail(dto: CreateContactDto) {
    const { name, email, phone, message, propertyId } = dto;

    const body = `Nouveau message de contact :\n\nNom : ${name}\nEmail : ${email}\nTéléphone : ${phone ?? 'Non spécifié'}\n\nMessage :\n${message}\n\nBien concerné : ${propertyId ?? 'Non spécifié'}`;

    try {
      const to = process.env.AGENCY_EMAIL;
      if (!to) {
        this.logger.error('La variable d\'environnement AGENCY_EMAIL n\'est pas définie.');
        return { success: false, error: 'AGENCY_EMAIL not configured' };
      }

      this.logger.debug(`Envoi email à ${to} depuis onboarding@resend.dev`);

      const response = await this.resend.emails.send({
        from: 'Agence <onboarding@resend.dev>',
        to,
        subject: `Nouveau message de ${name}`,
        text: body,
      });

      this.logger.log(`Resend response: ${JSON.stringify(response)}`);

      return { success: true, message: 'Email envoyé (request acceptée)', response };
    } catch (error: any) {
      this.logger.error('Erreur lors de l\'envoi de l\'email', error?.stack ?? error);
      return { success: false, error: error?.message ?? String(error) };
    }
  }
}
