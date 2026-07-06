import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { AuthMailService } from './auth-mail.service';
import {
  LOCKOUT_MINUTES,
  LOCKOUT_THRESHOLD,
} from '../types/auth-types.internal';
import { PasswordSecurityService } from './password-security.service';

@Injectable()
export class AuthCredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: AuthMailService,
    private readonly passwordSecurity: PasswordSecurityService,
  ) {}

  async validateCustomer(email: string, password: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: { group: true },
    });

    if (!customer || !customer.active || this.isLocked(customer.lockedUntil)) {
      return null;
    }

    const isValid = await this.passwordSecurity.verifyPassword(
      customer.password,
      password,
    );
    if (!isValid) {
      await this.recordCustomerFailedLogin(customer.id);
      return null;
    }

    await this.clearCustomerFailedLogins(customer.id);
    return customer;
  }

  async validateEmployee(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!employee || !employee.active || this.isLocked(employee.lockedUntil)) {
      return null;
    }

    const isValid = await this.passwordSecurity.verifyPassword(
      employee.password,
      password,
    );
    if (!isValid) {
      await this.recordEmployeeFailedLogin(employee.id);
      return null;
    }

    await this.clearEmployeeFailedLogins(employee.id);
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { lastConnectionDate: new Date() },
    });
    return employee;
  }

  private isLocked(lockedUntil: Date | null): boolean {
    return lockedUntil !== null && lockedUntil.getTime() > Date.now();
  }

  private lockoutDate(): Date {
    return new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
  }

  private async recordCustomerFailedLogin(id: string) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    if (customer.failedLoginAttempts === LOCKOUT_THRESHOLD) {
      const lockedUntil = this.lockoutDate();
      await this.prisma.customer.update({
        where: { id },
        data: { lockedUntil },
      });
      await this.sendAccountLockoutAlert(
        customer.email,
        'customer',
        lockedUntil,
      );
    }
  }

  private async recordEmployeeFailedLogin(id: string) {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    if (employee.failedLoginAttempts === LOCKOUT_THRESHOLD) {
      const lockedUntil = this.lockoutDate();
      await this.prisma.employee.update({
        where: { id },
        data: { lockedUntil },
      });
      await this.sendAccountLockoutAlert(
        employee.email,
        'employee',
        lockedUntil,
      );
    }
  }

  private async clearCustomerFailedLogins(id: string) {
    await this.prisma.customer.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  private async clearEmployeeFailedLogins(id: string) {
    await this.prisma.employee.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  private async sendAccountLockoutAlert(
    email: string,
    accountType: 'customer' | 'employee',
    lockedUntil: Date,
  ) {
    try {
      await this.mailService.sendAccountLockoutAlert({
        email,
        accountType,
        lockedUntil,
      });
    } catch (error) {
      this.passwordSecurity.logLockoutMailError(error);
    }
  }
}
