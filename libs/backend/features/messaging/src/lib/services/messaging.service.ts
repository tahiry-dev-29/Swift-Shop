import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailThreadRepository } from '../repositories/email-thread.repository';
import { EmailMessageRepository } from '../repositories/email-message.repository';

export const EMAIL_QUEUE_NAME = 'email-processing';
export const JOB_TYPES = {
  SEND_EMAIL: 'send_email',
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly threadRepo: EmailThreadRepository,
    private readonly messageRepo: EmailMessageRepository,
    @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue,
  ) {}

  async sendMessage(
    senderId: string | undefined,
    recipientId: string | undefined,
    subject: string,
    body: string,
  ) {
    const thread = await this.threadRepo.create({ subject });
    const message = await this.messageRepo.create({
      threadId: thread.id,
      senderId,
      recipientId,
      body,
    });

    // Queue job to process/send the email
    await this.emailQueue.add(
      JOB_TYPES.SEND_EMAIL,
      { messageId: message.id },
      {
        priority: 5,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return thread;
  }

  async replyToThread(
    senderId: string | undefined,
    threadId: string,
    body: string,
  ) {
    const thread = await this.threadRepo.findById(threadId);
    if (!thread) {
      throw new NotFoundException(`Thread #${threadId} not found`);
    }

    // Determine recipient from previous messages
    const lastMessage = thread.messages[0];
    const recipientId = lastMessage
      ? lastMessage.senderId === senderId
        ? lastMessage.recipientId
        : lastMessage.senderId
      : undefined;

    const message = await this.messageRepo.create({
      threadId,
      senderId,
      recipientId: recipientId ?? undefined,
      body,
    });

    await this.emailQueue.add(
      JOB_TYPES.SEND_EMAIL,
      { messageId: message.id },
      {
        priority: 5,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return message;
  }

  async getInbox(userId: string) {
    return this.threadRepo.findInbox(userId);
  }

  async getThread(threadId: string) {
    const thread = await this.threadRepo.findById(threadId);
    if (!thread) {
      throw new NotFoundException(`Thread #${threadId} not found`);
    }
    return thread;
  }
}
