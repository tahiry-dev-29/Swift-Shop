import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';

@Injectable()
export class SmtpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmtpService.name);
  private transporter!: Transporter;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') ?? '587'),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.transporter.close();
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const from = options.from ?? this.config.get<string>('SMTP_FROM');
    try {
      await this.transporter.sendMail({ ...options, from });
      this.logger.log(
        `Email sent to ${String(options.to)}: ${String(options.subject)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${String(options.to)}`, error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
