import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { Prisma } from '@dima-new/prisma-client';

@Injectable()
export class SupportTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(data: Prisma.SupportTicketUncheckedCreateInput) {
    return this.prisma.supportTicket.create({
      data,
      include: { messages: true },
    });
  }

  async addMessage(data: Prisma.TicketMessageUncheckedCreateInput) {
    return this.prisma.ticketMessage.create({ data });
  }

  async updateTicket(
    ticketId: string,
    data: Prisma.SupportTicketUncheckedUpdateInput,
  ) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });
  }

  async assignTicket(ticketId: string, employeeId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { employeeId },
      include: { messages: true },
    });
  }

  async findTicketById(ticketId: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: true },
    });
  }

  async findAll() {
    return this.prisma.supportTicket.findMany({
      include: { messages: true },
      orderBy: { dateAdd: 'desc' },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.supportTicket.findMany({
      where: { customerId },
      include: { messages: true },
      orderBy: { dateAdd: 'desc' },
    });
  }
}
