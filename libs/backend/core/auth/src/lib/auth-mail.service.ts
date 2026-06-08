import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(payload: EmailPayload): Promise<void> {
    const endpoint = this.configService.get<string>('EMAIL_PROVIDER_API_URL');
    const apiKey = this.configService.get<string>('EMAIL_PROVIDER_API_KEY');
    const from = this.configService.get<string>('EMAIL_FROM');

    if (!endpoint || !apiKey || !from) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error('Email provider is not configured');
      }
      this.logger.warn(
        `Email provider not configured. Skipping "${payload.subject}" for ${payload.to}.`,
      );
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email provider failed with HTTP ${response.status}`);
    }
  }

  async sendCustomerMagicLink(email: string, magicLink: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Votre lien de connexion',
      text: `Connectez-vous avec ce lien valable 15 minutes: ${magicLink}`,
      html: `<p>Connectez-vous avec ce lien valable 15 minutes:</p><p><a href="${magicLink}">${magicLink}</a></p>`,
    });
  }

  async sendAccountLockoutAlert(input: {
    email: string;
    accountType: 'customer' | 'employee';
    lockedUntil: Date;
  }): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'Alerte securite: compte temporairement verrouille',
      text: `Votre compte ${input.accountType} a ete verrouille jusqu'au ${input.lockedUntil.toISOString()} apres plusieurs echecs de connexion.`,
    });
  }
}
