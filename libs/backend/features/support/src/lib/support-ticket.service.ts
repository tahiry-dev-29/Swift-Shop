import { Injectable, Logger } from '@nestjs/common';
import { SupportTicketRepository } from './support-ticket.repository';
import { SupportTicketFormatter } from './support-ticket.formatter';
import {
  CreateTicketDto,
  ReplyTicketDto,
  AssignTicketDto,
} from './interfaces/support.interface';

@Injectable()
export class SupportTicketService {
  private readonly logger = new Logger(SupportTicketService.name);

  constructor(
    private readonly repository: SupportTicketRepository,
    private readonly formatter: SupportTicketFormatter,
  ) {}

  async createTicket(dto: CreateTicketDto) {
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const reference = `TKT-${Date.now()}-${randomSuffix}`;
    const data = {
      reference,
      customerId: dto.customerId,
      subject: dto.subject,
      priority: dto.priority ?? 'NORMAL',
      messages: {
        create: {
          senderType: 'CUSTOMER',
          senderId: dto.customerId,
          content: dto.message,
        },
      },
    };

    const ticket = await this.repository.createTicket(data);
    this.logger.log(`Created support ticket ${reference}`);
    return this.formatter.formatTicket(ticket);
  }

  async replyToTicket(ticketId: string, dto: ReplyTicketDto) {
    const data = {
      ticketId,
      senderType: dto.senderType,
      senderId: dto.senderId,
      content: dto.content,
      isInternal: dto.isInternal ?? false,
    };

    const message = await this.repository.addMessage(data);

    if (dto.senderType === 'EMPLOYEE') {
      await this.repository.updateTicket(ticketId, { status: 'IN_PROGRESS' });
    }

    this.logger.log(`Reply added to ticket ${ticketId}`);
    return this.formatter.formatMessage(message);
  }

  async assignTicket(ticketId: string, dto: AssignTicketDto) {
    const ticket = await this.repository.assignTicket(ticketId, dto.employeeId);
    this.logger.log(
      `Ticket ${ticketId} assigned to employee ${dto.employeeId}`,
    );
    return this.formatter.formatTicket(ticket);
  }

  async findAll() {
    const tickets = await this.repository.findAll();
    return tickets.map((t) => this.formatter.formatTicket(t));
  }

  async findByCustomer(customerId: string) {
    const tickets = await this.repository.findByCustomer(customerId);
    return tickets.map((t) => this.formatter.formatTicket(t));
  }
}
