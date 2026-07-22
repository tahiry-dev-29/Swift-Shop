import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SupportTicketResolver } from './support-ticket.resolver';
import { SupportTicketService } from './support-ticket.service';
import { AuthUser } from '@swift-shop/backend/auth';

describe('SupportTicketResolver Integration Tests', () => {
  let resolver: SupportTicketResolver;
  let serviceMock: Mocked<SupportTicketService>;

  const mockCustomerUser: AuthUser = {
    id: 'cust-100',
    type: 'customer',
    email: 'customer@test.com',
  };

  const mockEmployeeUser: AuthUser = {
    id: 'emp-200',
    type: 'employee',
    email: 'agent@test.com',
  };

  beforeEach(() => {
    serviceMock = {
      createTicket: vi.fn(),
      replyToTicket: vi.fn(),
      assignTicket: vi.fn(),
      findAll: vi.fn(),
      findByCustomer: vi.fn(),
    } as unknown as Mocked<SupportTicketService>;

    resolver = new SupportTicketResolver(serviceMock);
  });

  it('createSupportTicket — customer creates a new support ticket', async () => {
    const input = {
      subject: 'Broken item',
      message: 'Help me',
      priority: 'HIGH',
    };
    serviceMock.createTicket.mockResolvedValue({
      id: 'tkt-1',
      reference: 'TKT-1',
      customerId: 'cust-100',
      subject: 'Broken item',
      priority: 'HIGH',
      status: 'OPEN',
      dateAdd: new Date(),
      dateUpd: new Date(),
      messages: [],
    } as never);

    const res = await resolver.createSupportTicket(input, mockCustomerUser);

    expect(res.id).toBe('tkt-1');
    expect(serviceMock.createTicket).toHaveBeenCalledWith({
      ...input,
      customerId: 'cust-100',
    });
  });

  it('replyToTicket — customer replies to ticket', async () => {
    const input = { content: 'More info here' };
    serviceMock.replyToTicket.mockResolvedValue({
      id: 'msg-1',
      ticketId: 'tkt-1',
      senderType: 'CUSTOMER',
      senderId: 'cust-100',
      content: 'More info here',
      isInternal: false,
      dateAdd: new Date(),
    } as never);

    const res = await resolver.replyToTicket('tkt-1', input, mockCustomerUser);

    expect(res.content).toBe('More info here');
    expect(serviceMock.replyToTicket).toHaveBeenCalledWith('tkt-1', {
      ...input,
      senderId: 'cust-100',
      senderType: 'CUSTOMER',
    });
  });

  it('agentReplyToTicket — employee agent sends internal/external reply', async () => {
    const input = {
      content: 'Internal note for support team',
      isInternal: true,
    };
    serviceMock.replyToTicket.mockResolvedValue({
      id: 'msg-2',
      ticketId: 'tkt-1',
      senderType: 'EMPLOYEE',
      senderId: 'emp-200',
      content: 'Internal note for support team',
      isInternal: true,
      dateAdd: new Date(),
    } as never);

    const res = await resolver.agentReplyToTicket(
      'tkt-1',
      input,
      mockEmployeeUser,
    );

    expect(res.isInternal).toBe(true);
    expect(serviceMock.replyToTicket).toHaveBeenCalledWith('tkt-1', {
      ...input,
      senderId: 'emp-200',
      senderType: 'EMPLOYEE',
    });
  });

  it('assignSupportTicket — employee assigns ticket to staff', async () => {
    serviceMock.assignTicket.mockResolvedValue({
      id: 'tkt-1',
      employeeId: 'emp-assigned',
    } as never);

    const res = await resolver.assignSupportTicket('tkt-1', {
      employeeId: 'emp-assigned',
    });

    expect(res.employeeId).toBe('emp-assigned');
  });

  it('mySupportTickets — customer views personal tickets list', async () => {
    serviceMock.findByCustomer.mockResolvedValue([
      { id: 'tkt-1', customerId: 'cust-100' } as never,
    ]);

    const res = await resolver.mySupportTickets(mockCustomerUser);

    expect(res).toHaveLength(1);
    expect(serviceMock.findByCustomer).toHaveBeenCalledWith('cust-100');
  });
});
