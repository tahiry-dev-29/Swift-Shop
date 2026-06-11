import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import {
  pwnedPasswordRangeIncludesSuffix,
  sha1PasswordParts,
  validateLocalPasswordPolicy,
} from '../policies/password-policy';

@Injectable()
export class PasswordSecurityService {
  private readonly logger = new Logger(PasswordSecurityService.name);

  constructor(private readonly configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    await this.assertPasswordPolicy(password);
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async assertPasswordPolicy(password: string): Promise<void> {
    this.assertLocalPasswordPolicy(password);
    await this.assertPasswordNotPwned(password);
  }

  assertLocalPasswordPolicy(password: string): void {
    validateLocalPasswordPolicy(password);
  }

  async hashWithoutPolicy(password: string): Promise<string> {
    return argon2.hash(password);
  }

  logLockoutMailError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Account lockout email failed: ${message}`);
  }

  private shouldCheckPwnedPasswords(): boolean {
    return (
      this.configService.get<string>('HIBP_PASSWORD_CHECK_ENABLED') !== 'false'
    );
  }

  private async assertPasswordNotPwned(password: string): Promise<void> {
    if (!this.shouldCheckPwnedPasswords()) {
      return;
    }

    const { prefix, suffix } = sha1PasswordParts(password);
    const response = await this.fetchPwnedPasswordRange(prefix);

    if (!response.ok) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error('Unable to verify password breach status');
      }
      return;
    }

    const body = await response.text();
    if (pwnedPasswordRangeIncludesSuffix(body, suffix)) {
      throw new Error('Password has appeared in a known data breach');
    }
  }

  private async fetchPwnedPasswordRange(prefix: string): Promise<Response> {
    try {
      return await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'user-agent': 'dima-new-auth-password-policy' },
      });
    } catch (error) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw error;
      }
      return new Response('', { status: 503 });
    }
  }
}
