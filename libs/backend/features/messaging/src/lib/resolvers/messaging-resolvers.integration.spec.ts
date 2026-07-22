import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { MessagingResolver } from './messaging.resolver';
import { EmailTemplateResolver } from './email-template.resolver';
import { MessagingService } from '../services/messaging.service';
import { EmailTemplateService } from '../services/email-template.service';
import { AuthUser } from '@swift-shop/backend/auth';

describe('Messaging Resolvers Integration Tests', () => {
  let messagingResolver: MessagingResolver;
  let emailTemplateResolver: EmailTemplateResolver;
  let messagingServiceMock: Mocked<MessagingService>;
  let emailTemplateServiceMock: Mocked<EmailTemplateService>;

  const mockUser: AuthUser = {
    id: 'user-100',
    type: 'customer',
    email: 'user@test.com',
  };

  beforeEach(() => {
    messagingServiceMock = {
      getInbox: vi.fn(),
      getThread: vi.fn(),
      sendMessage: vi.fn(),
      replyToThread: vi.fn(),
    } as unknown as Mocked<MessagingService>;

    emailTemplateServiceMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<EmailTemplateService>;

    messagingResolver = new MessagingResolver(messagingServiceMock);
    emailTemplateResolver = new EmailTemplateResolver(emailTemplateServiceMock);
  });

  describe('MessagingResolver', () => {
    it('myInbox — queries threads for user', async () => {
      messagingServiceMock.getInbox.mockResolvedValue([
        { id: 'th-1', subject: 'Inbox thread' } as never,
      ]);

      const inbox = await messagingResolver.myInbox(mockUser);

      expect(inbox).toHaveLength(1);
      expect(messagingServiceMock.getInbox).toHaveBeenCalledWith('user-100');
    });

    it('sendMessage — creates thread & message', async () => {
      messagingServiceMock.sendMessage.mockResolvedValue({
        id: 'th-1',
        subject: 'Inquiry',
      } as never);

      const res = await messagingResolver.sendMessage(
        { recipientId: 'rec-1', subject: 'Inquiry', body: 'Question' },
        mockUser,
      );

      expect(res.id).toBe('th-1');
      expect(messagingServiceMock.sendMessage).toHaveBeenCalledWith(
        'user-100',
        'rec-1',
        'Inquiry',
        'Question',
      );
    });
  });

  describe('EmailTemplateResolver', () => {
    it('emailTemplates — fetches all templates', async () => {
      emailTemplateServiceMock.findAll.mockResolvedValue([
        { id: 'tmpl-1', name: 'Welcome' } as never,
      ]);

      const templates = await emailTemplateResolver.emailTemplates();

      expect(templates).toHaveLength(1);
    });

    it('createEmailTemplate — creates template', async () => {
      const input = {
        name: 'Promo',
        subject: 'Sale!',
        bodyHtml: '<b>50% OFF</b>',
      };
      emailTemplateServiceMock.create.mockResolvedValue({
        id: 'tmpl-2',
        ...input,
      } as never);

      const res = await emailTemplateResolver.createEmailTemplate(input);

      expect(res.id).toBe('tmpl-2');
    });
  });
});
