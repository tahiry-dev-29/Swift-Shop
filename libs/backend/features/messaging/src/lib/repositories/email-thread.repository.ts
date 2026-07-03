import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

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
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findInbox(userId: string) {
    return this.prisma.emailThread.findMany({
      where: {
        messages: {
          some: {
            recipientId: userId,
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
