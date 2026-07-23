import { Injectable } from '@nestjs/common';
import { SupportTicket, TicketMessage } from '@swift-shop/prisma-client';

@Injectable()
export class SupportTicketFormatter {
  formatTicket(ticket: SupportTicket & { messages?: TicketMessage[] }) {
    if (!ticket) return null;
    return {
      id: ticket.id,
      reference: ticket.reference,
      customerId: ticket.customerId ?? undefined,
      employeeId: ticket.employeeId ?? undefined,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.dateAdd,
      updatedAt: ticket.dateUpd,
      messages: ticket.messages
        ? ticket.messages.map((m: TicketMessage) => this.formatMessage(m))
        : [],
    };
  }

  formatMessage(message: TicketMessage) {
    if (!message) return null;
    return {
      id: message.id,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      isInternal: message.isInternal,
      createdAt: message.dateAdd,
    };
  }
}
