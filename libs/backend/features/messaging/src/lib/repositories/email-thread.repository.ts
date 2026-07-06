import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class EmailThreadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { subject: string }) {
    return this.prisma.emailThread.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.emailThread.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async touch(id: string) {
    return this.prisma.emailThread.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async findInbox(userId: string) {
    return this.prisma.emailThread.findMany({
      where: {
        messages: {
          some: {
            OR: [{ recipientId: userId }, { senderId: userId }],
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
