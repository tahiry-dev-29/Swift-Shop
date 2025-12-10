import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { AuthService } from '@dima-new/backend/auth';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { group: true, addresses: true },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: { group: true },
      orderBy: { dateAdd: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findUnique({
      where: { email },
      include: { group: true },
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    groupId: string;
    birthday?: Date;
    company?: string;
    optin?: boolean;
  }) {
    const hashedPassword = await this.authService.hashPassword(data.password);

    return this.prisma.customer.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: { group: true },
    });
  }

  async updateProfile(id: string, data: {
    firstname?: string;
    lastname?: string;
    company?: string;
    birthday?: Date;
    optin?: boolean;
  }) {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: { group: true },
    });
  }
}

