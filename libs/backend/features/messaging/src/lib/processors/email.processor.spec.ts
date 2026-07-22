import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { EmailProcessor } from './email.processor';
import { EmailMessageRepository } from '../repositories/email-message.repository';
import { SmtpService } from '@swift-shop/backend/auth';
import { Job } from 'bullmq';

describe('EmailProcessor Queue Worker', () => {
  let processor: EmailProcessor;
  let repoMock: Mocked<EmailMessageRepository>;
  let smtpMock: Mocked<SmtpService>;

  beforeEach(() => {
    repoMock = {
      findById: vi.fn(),
      getEmailForUser: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as Mocked<EmailMessageRepository>;

    smtpMock = {
      sendMail: vi.fn(),
    } as unknown as Mocked<SmtpService>;

    processor = new EmailProcessor(repoMock, smtpMock);
  });

  it('should send email via SMTP and mark message as SENT', async () => {
    const mockJob = {
      name: 'send_email',
      data: { messageId: 'msg-100' },
    } as Job<{ messageId: string }>;

    repoMock.findById.mockResolvedValue({
      id: 'msg-100',
      recipientId: 'user-200',
      body: '<h1>Welcome</h1>',
      thread: { subject: 'Welcome Email' },
    } as never);
    repoMock.getEmailForUser.mockResolvedValue('user@shop.com');
    smtpMock.sendMail.mockResolvedValue(true as never);

    await processor.process(mockJob);

    expect(smtpMock.sendMail).toHaveBeenCalledWith({
      to: 'user@shop.com',
      subject: 'Welcome Email',
      html: '<h1>Welcome</h1>',
    });
    expect(repoMock.updateStatus).toHaveBeenCalledWith('msg-100', 'SENT');
  });

  it('should mark status as FAILED if SMTP send raises error', async () => {
    const mockJob = {
      name: 'send_email',
      data: { messageId: 'msg-100' },
    } as Job<{ messageId: string }>;

    repoMock.findById.mockResolvedValue({
      id: 'msg-100',
      recipientId: 'user-200',
      body: 'Text',
      thread: { subject: 'Subj' },
    } as never);
    repoMock.getEmailForUser.mockResolvedValue('user@shop.com');
    smtpMock.sendMail.mockRejectedValue(new Error('SMTP Connection timeout'));

    await expect(processor.process(mockJob)).rejects.toThrow(
      'SMTP Connection timeout',
    );
    expect(repoMock.updateStatus).toHaveBeenCalledWith('msg-100', 'FAILED');
  });
});
