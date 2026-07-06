import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailMessageRepository } from '../repositories/email-message.repository';
import { EMAIL_QUEUE_NAME, JOB_TYPES } from '../services/messaging.service';
import { SmtpService } from '@swift-shop/backend/auth';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly messageRepo: EmailMessageRepository,
    private readonly smtpService: SmtpService,
  ) {
    super();
  }

  async process(job: Job<{ messageId: string }>) {
    switch (job.name) {
      case JOB_TYPES.SEND_EMAIL:
        return this.handleSendEmail(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async handleSendEmail(job: Job<{ messageId: string }>) {
    const { messageId } = job.data;
    this.logger.log(`Processing send email job for message ${messageId}`);

    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      this.logger.error(`Message ${messageId} not found in database`);
      return;
    }

    if (!message.recipientId) {
      this.logger.warn(
        `Message ${messageId} has no recipientId. Skipping email sending.`,
      );
      await this.messageRepo.updateStatus(messageId, 'SENT');
      return;
    }

    const recipientEmail = await this.messageRepo.getEmailForUser(
      message.recipientId,
    );
    if (!recipientEmail) {
      this.logger.error(
        `Could not resolve email address for user ID ${message.recipientId}`,
      );
      await this.messageRepo.updateStatus(messageId, 'FAILED');
      throw new Error(
        `Could not resolve email address for recipient ID ${message.recipientId}`,
      );
    }

    try {
      await this.smtpService.sendMail({
        to: recipientEmail,
        subject: message.thread.subject,
        html: message.body,
      });

      await this.messageRepo.updateStatus(messageId, 'SENT');
      this.logger.log(
        `Successfully sent email for message ${messageId} to ${recipientEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email for message ${messageId}`, error);
      await this.messageRepo.updateStatus(messageId, 'FAILED');
      throw error;
    }
  }
}
