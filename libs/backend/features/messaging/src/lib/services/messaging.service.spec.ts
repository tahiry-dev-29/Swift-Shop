import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { MessagingService } from './messaging.service';
import { EmailThreadRepository } from '../repositories/email-thread.repository';
import { EmailMessageRepository } from '../repositories/email-message.repository';
import { Queue } from 'bullmq';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MessagingService', () => {
  let service: MessagingService;
  let threadRepoMock: Mocked<EmailThreadRepository>;
  let messageRepoMock: Mocked<EmailMessageRepository>;
  let queueMock: Mocked<Queue>;

  beforeEach(() => {
    threadRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      touch: vi.fn(),
      findInbox: vi.fn(),
    } as unknown as Mocked<EmailThreadRepository>;

    messageRepoMock = {
      getEmailForUser: vi.fn(),
      create: vi.fn(),
    } as unknown as Mocked<EmailMessageRepository>;

    queueMock = {
      add: vi.fn(),
    } as unknown as Mocked<Queue>;

    service = new MessagingService(threadRepoMock, messageRepoMock, queueMock);
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if recipientId is invalid', async () => {
      messageRepoMock.getEmailForUser.mockResolvedValue(null);

      await expect(
        service.sendMessage('s1', 'invalid-r1', 'Subject', 'Body'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new email thread, message record and add job to queue', async () => {
      messageRepoMock.getEmailForUser.mockResolvedValue('user@test.com');
      threadRepoMock.create.mockResolvedValue({
        id: 'th-1',
        subject: 'Subject',
      } as never);
      messageRepoMock.create.mockResolvedValue({
        id: 'msg-1',
        threadId: 'th-1',
      } as never);

      const thread = await service.sendMessage('s1', 'r1', 'Subject', 'Body');

      expect(threadRepoMock.create).toHaveBeenCalledWith({
        subject: 'Subject',
      });
      expect(queueMock.add).toHaveBeenCalledWith(
        'send_email',
        { messageId: 'msg-1' },
        expect.objectContaining({ priority: 5 }),
      );
      expect(thread.id).toBe('th-1');
    });
  });

  describe('replyToThread', () => {
    it('should throw NotFoundException if thread is not found', async () => {
      threadRepoMock.findById.mockResolvedValue(null);

      await expect(
        service.replyToThread('s1', 'invalid-thread', 'Reply body'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant in thread', async () => {
      threadRepoMock.findById.mockResolvedValue({
        id: 'th-1',
        messages: [{ senderId: 'other-1', recipientId: 'other-2' }],
      } as never);

      await expect(
        service.replyToThread('unauthorized-user', 'th-1', 'Reply body'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should append reply to thread, update thread timestamp, and queue email job', async () => {
      threadRepoMock.findById.mockResolvedValue({
        id: 'th-1',
        messages: [{ senderId: 'other-1', recipientId: 's1' }],
      } as never);
      messageRepoMock.create.mockResolvedValue({ id: 'msg-reply-1' } as never);

      const msg = await service.replyToThread('s1', 'th-1', 'My reply');

      expect(messageRepoMock.create).toHaveBeenCalledWith({
        threadId: 'th-1',
        senderId: 's1',
        recipientId: 'other-1',
        body: 'My reply',
      });
      expect(threadRepoMock.touch).toHaveBeenCalledWith('th-1');
      expect(queueMock.add).toHaveBeenCalled();
      expect(msg.id).toBe('msg-reply-1');
    });
  });

  describe('getInbox', () => {
    it('should return inbox threads for specified user ID', async () => {
      threadRepoMock.findInbox.mockResolvedValue([
        { id: 'th-1', subject: 'Thread 1' } as never,
      ]);

      const inbox = await service.getInbox('u1');

      expect(inbox).toHaveLength(1);
      expect(threadRepoMock.findInbox).toHaveBeenCalledWith('u1');
    });
  });
});
