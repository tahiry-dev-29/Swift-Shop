import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
    if (recipientId && recipientId !== 'SYSTEM') {
      const email = await this.messageRepo.getEmailForUser(recipientId);
      if (!email) {
        throw new BadRequestException(
          `Recipient #${recipientId} does not exist`,
        );
      }
    }

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

    // Ensure the sender is a participant in the thread
    const isParticipant = thread.messages.some(
      (m) => m.senderId === senderId || m.recipientId === senderId
    );
    if (!isParticipant) {
      throw new ForbiddenException('You do not have permission to reply to this thread');
    }

    // Verify sender is a participant of the thread
    const isParticipant = thread.messages.some(
      (m) => m.senderId === senderId || m.recipientId === senderId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    // Determine recipient from previous messages (the last message is at index length - 1)
    const lastMessage = thread.messages[thread.messages.length - 1];
    const recipientId = lastMessage
      ? lastMessage.senderId === senderId
        ? lastMessage.recipientId
        : lastMessage.senderId
      : undefined;

    if (recipientId === 'SYSTEM') {
      throw new BadRequestException('Cannot reply to a system message');
    }

    const message = await this.messageRepo.create({
      threadId,
      senderId,
      recipientId: recipientId ?? undefined,
      body,
    });

    // Update parent thread's updatedAt timestamp
    await this.threadRepo.touch(threadId);

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

  async getThread(threadId: string, userId: string) {
    const thread = await this.threadRepo.findById(threadId);
    if (!thread) {
      throw new NotFoundException(`Thread #${threadId} not found`);
    }

    const isParticipant = thread.messages.some(
      (m) => m.senderId === userId || m.recipientId === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    return thread;
  }
}
