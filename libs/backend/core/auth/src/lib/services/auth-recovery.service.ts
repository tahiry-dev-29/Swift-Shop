import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { JwtPayload } from '@swift-shop/models';
import { AuthMailService } from './auth-mail.service';
import {
  MAGIC_LINK_TTL,
  PASSWORD_RESET_TTL,
} from '../types/auth-types.internal';
import { PasswordSecurityService } from './password-security.service';

@Injectable()
export class AuthRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: AuthMailService,
    private readonly passwordSecurity: PasswordSecurityService,
  ) {}

  async sendCustomerMagicLink(email: string, magicLink: string): Promise<void> {
    await this.mailService.sendCustomerMagicLink(email, magicLink);
  }

  generateCustomerMagicLinkToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  }) {
    return this.jwtService.sign(
      {
        sub: customer.id,
        email: customer.email,
        type: 'customer',
        purpose: 'customer_magic_link',
        firstname: customer.firstname,
        lastname: customer.lastname,
      } satisfies JwtPayload,
      { expiresIn: MAGIC_LINK_TTL },
    );
  }

  async verifyCustomerMagicLink(token: string) {
    const payload = this.jwtService.verify<JwtPayload>(token);
    if (
      payload.type !== 'customer' ||
      payload.purpose !== 'customer_magic_link'
    ) {
      return null;
    }
    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
      include: { group: true },
    });
    if (!customer || !customer.active || this.isLocked(customer.lockedUntil)) {
      return null;
    }
    return customer;
  }

  generateEmployeePasswordResetToken(employee: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    return this.jwtService.sign(
      {
        sub: employee.id,
        email: employee.email,
        type: 'employee',
        purpose: 'employee_password_reset',
        firstname: employee.firstname,
        lastname: employee.lastname,
        role: employee.role.name,
      } satisfies JwtPayload,
      { expiresIn: PASSWORD_RESET_TTL },
    );
  }

  async completeForcedPasswordReset(token: string, password: string) {
    await this.passwordSecurity.assertPasswordPolicy(password);
    const payload = this.jwtService.verify<JwtPayload>(token);
    if (
      payload.type !== 'employee' ||
      payload.purpose !== 'employee_password_reset'
    ) {
      return null;
    }
    const hashedPassword =
      await this.passwordSecurity.hashWithoutPolicy(password);
    return this.prisma.employee.update({
      where: { id: payload.sub },
      data: {
        password: hashedPassword,
        forcePasswordReset: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      include: { role: true },
    });
  }

  private isLocked(lockedUntil: Date | null): boolean {
    return lockedUntil !== null && lockedUntil.getTime() > Date.now();
  }
}
