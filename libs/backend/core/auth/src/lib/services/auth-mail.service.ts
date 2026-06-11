import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmtpService } from '../infrastructure/smtp/smtp.service';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);

  constructor(
    private readonly smtp: SmtpService,
    private readonly config: ConfigService,
  ) {}

  async send(payload: EmailPayload): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM');

    if (!from) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new Error('SMTP_FROM is not configured');
      }
      this.logger.warn(
        `SMTP not configured — skipping "${payload.subject}" for ${payload.to}`,
      );
      return;
    }

    await this.smtp.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  async sendCustomerMagicLink(email: string, magicLink: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Votre lien de connexion',
      text: `Connectez-vous avec ce lien valable 15 minutes: ${magicLink}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2>Connexion à votre compte</h2>
          <p>Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien est valable <strong>15 minutes</strong>.</p>
          <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Se connecter
          </a>
          <p style="margin-top:16px;font-size:12px;color:#6b7280">
            Si vous n'avez pas demandé ce lien, ignorez cet email.
          </p>
        </div>
      `,
    });
  }

  async sendAccountLockoutAlert(input: {
    email: string;
    accountType: 'customer' | 'employee';
    lockedUntil: Date;
  }): Promise<void> {
    const until = input.lockedUntil.toLocaleString('fr-FR');
    await this.send({
      to: input.email,
      subject: 'Alerte sécurité : compte temporairement verrouillé',
      text: `Votre compte ${input.accountType} a été verrouillé jusqu'au ${until} après plusieurs échecs de connexion.`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2>⚠️ Alerte sécurité</h2>
          <p>Votre compte <strong>${input.accountType}</strong> a été temporairement verrouillé suite à plusieurs tentatives de connexion échouées.</p>
          <p>Accès rétabli le : <strong>${until}</strong></p>
          <p style="font-size:12px;color:#6b7280">Si vous n'êtes pas à l'origine de ces tentatives, changez votre mot de passe immédiatement.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Réinitialisez votre mot de passe via ce lien (valable 1 heure) : ${resetLink}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2>Réinitialisation du mot de passe</h2>
          <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Réinitialiser le mot de passe
          </a>
          <p style="margin-top:16px;font-size:12px;color:#6b7280">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
      `,
    });
  }

  async sendWelcome(email: string, firstname: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Bienvenue !',
      text: `Bonjour ${firstname}, bienvenue sur notre plateforme.`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2>Bienvenue, ${firstname} 👋</h2>
          <p>Votre compte a bien été créé. Vous pouvez dès à présent vous connecter.</p>
        </div>
      `,
    });
  }
}
