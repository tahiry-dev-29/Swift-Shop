import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '@dima-new/data-access-prisma';
import { JwtPayload } from '@dima-new/models';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async validateCustomer(email: string, password: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: { group: true },
    });

    if (!customer || !customer.active) {
      return null;
    }

    const isValid = await this.verifyPassword(customer.password, password);
    if (!isValid) {
      return null;
    }

    return customer;
  }

  async validateEmployee(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!employee || !employee.active) {
      return null;
    }

    const isValid = await this.verifyPassword(employee.password, password);
    if (!isValid) {
      return null;
    }

    
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { lastConnectionDate: new Date() },
    });

    return employee;
  }

  generateCustomerToken(customer: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    group?: { name: string; reduction: unknown } | null;
  }) {
    const payload: JwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
      firstname: customer.firstname,
      lastname: customer.lastname,
      groupName: customer.group?.name,
      groupReduction: customer.group?.reduction
        ? Number(customer.group.reduction)
        : undefined,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  generateEmployeeToken(employee: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      type: 'employee',
      firstname: employee.firstname,
      lastname: employee.lastname,
      role: employee.role.name,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
