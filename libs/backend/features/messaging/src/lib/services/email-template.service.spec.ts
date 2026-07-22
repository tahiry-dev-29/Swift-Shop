import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateRepository } from '../repositories/email-template.repository';
import { NotFoundException } from '@nestjs/common';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  let repoMock: Mocked<EmailTemplateRepository>;

  beforeEach(() => {
    repoMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<EmailTemplateRepository>;

    service = new EmailTemplateService(repoMock);
  });

  describe('findById', () => {
    it('should throw NotFoundException when template does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create email template', async () => {
      repoMock.create.mockResolvedValue({
        id: 'tmpl-1',
        name: 'Order Confirmation',
        subject: 'Order #{{orderId}}',
        bodyHtml: '<p>Thanks for your order</p>',
      } as never);

      const result = await service.create({
        name: 'Order Confirmation',
        subject: 'Order #{{orderId}}',
        bodyHtml: '<p>Thanks for your order</p>',
      });

      expect(result.name).toBe('Order Confirmation');
    });
  });
});
