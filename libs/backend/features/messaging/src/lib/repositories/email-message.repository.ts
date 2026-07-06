import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class EmailMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    threadId: string;
    senderId?: string;
    recipientId?: string;
    body: string;
  }) {
    return this.prisma.emailMessage.create({
      data,
      include: {
        attachments: true,
      },
    });
  }

  async findByThread(threadId: string) {
    return this.prisma.emailMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        attachments: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.emailMessage.findUnique({
      where: { id },
      include: {
        thread: true,
        attachments: true,
      },
    });
  }

  async getEmailForUser(userId: string): Promise<string | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (customer) return customer.email;

    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (employee) return employee.email;

    return null;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.emailMessage.update({
      where: { id },
      data: { status },
    });
  }
}
