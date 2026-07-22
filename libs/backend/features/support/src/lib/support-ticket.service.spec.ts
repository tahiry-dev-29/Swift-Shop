import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketRepository } from './support-ticket.repository';
import { SupportTicketFormatter } from './support-ticket.formatter';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('SupportTicketService', () => {
  let service: SupportTicketService;
  let repositoryMock: Mocked<SupportTicketRepository>;
  let formatter: SupportTicketFormatter;

  beforeEach(() => {
    repositoryMock = {
      createTicket: vi.fn(),
      findTicketById: vi.fn(),
      addMessage: vi.fn(),
      updateTicket: vi.fn(),
      assignTicket: vi.fn(),
      findAll: vi.fn(),
      findByCustomer: vi.fn(),
    } as unknown as Mocked<SupportTicketRepository>;

    formatter = new SupportTicketFormatter();
    service = new SupportTicketService(repositoryMock, formatter);
  });

  describe('createTicket', () => {
    it('should create new support ticket with reference number and auto-formatted response', async () => {
      repositoryMock.createTicket.mockResolvedValue({
        id: 'tkt-1',
        reference: 'TKT-123-ABCD',
        customerId: 'c1',
        employeeId: null,
        subject: 'Defective item',
        status: 'OPEN',
        priority: 'HIGH',
        dateAdd: new Date(),
        dateUpd: new Date(),
        messages: [],
      } as never);

      const result = await service.createTicket({
        customerId: 'c1',
        subject: 'Defective item',
        message: 'Item arrived broken',
        priority: 'HIGH',
      });

      expect(repositoryMock.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'c1',
          subject: 'Defective item',
          priority: 'HIGH',
        }),
      );
      expect(result.id).toBe('tkt-1');
    });
  });

  describe('replyToTicket', () => {
    it('should throw NotFoundException if ticket does not exist', async () => {
      repositoryMock.findTicketById.mockResolvedValue(null);

      await expect(
        service.replyToTicket('invalid-id', {
          senderType: 'CUSTOMER',
          senderId: 'c1',
          content: 'Hello',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if customer tries to reply to another customer ticket (BOLA protection)', async () => {
      repositoryMock.findTicketById.mockResolvedValue({
        id: 'tkt-1',
        customerId: 'owner-c1',
      } as never);

      await expect(
        service.replyToTicket('tkt-1', {
          senderType: 'CUSTOMER',
          senderId: 'attacker-c2',
          content: 'Malicious reply',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should add reply message and set ticket status to IN_PROGRESS when employee replies', async () => {
      repositoryMock.findTicketById.mockResolvedValue({
        id: 'tkt-1',
        customerId: 'c1',
      } as never);
      repositoryMock.addMessage.mockResolvedValue({
        id: 'msg-1',
        ticketId: 'tkt-1',
        senderType: 'EMPLOYEE',
        senderId: 'emp-1',
        content: 'We are investigating',
        isInternal: false,
        dateAdd: new Date(),
      } as never);

      const message = await service.replyToTicket('tkt-1', {
        senderType: 'EMPLOYEE',
        senderId: 'emp-1',
        content: 'We are investigating',
      });

      expect(repositoryMock.updateTicket).toHaveBeenCalledWith('tkt-1', {
        status: 'IN_PROGRESS',
      });
      expect(message.content).toBe('We are investigating');
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to specified employee and return formatted ticket', async () => {
      repositoryMock.assignTicket.mockResolvedValue({
        id: 'tkt-1',
        reference: 'REF123',
        customerId: 'c1',
        employeeId: 'emp-agent',
        subject: 'Help',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        dateAdd: new Date(),
        dateUpd: new Date(),
        messages: [],
      } as never);

      const ticket = await service.assignTicket('tkt-1', {
        employeeId: 'emp-agent',
      });

      expect(ticket.employeeId).toBe('emp-agent');
    });
  });
});
