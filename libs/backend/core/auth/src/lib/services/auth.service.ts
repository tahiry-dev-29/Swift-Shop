import { Injectable } from '@nestjs/common';
import {
  AuditInput,
  OAuthProvider,
  SessionAnomalyInput,
} from '../types/auth-types.internal';
import { AuthAuditService } from './auth-audit.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthOAuthService } from './auth-oauth.service';
import { AuthRecoveryService } from './auth-recovery.service';
import { AuthTokenService } from './auth-token.service';
import { PasswordSecurityService } from './password-security.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly auditService: AuthAuditService,
    private readonly credentialsService: AuthCredentialsService,
    private readonly oauthService: AuthOAuthService,
    private readonly recoveryService: AuthRecoveryService,
    private readonly tokenService: AuthTokenService,
    private readonly passwordSecurity: PasswordSecurityService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  hashPassword(password: string): Promise<string> {
    return this.passwordSecurity.hashPassword(password);
  }

  verifyPassword(hash: string, password: string): Promise<boolean> {
    return this.passwordSecurity.verifyPassword(hash, password);
  }

  assertPasswordPolicy(password: string): Promise<void> {
    return this.passwordSecurity.assertPasswordPolicy(password);
  }

  assertLocalPasswordPolicy(password: string): void {
    this.passwordSecurity.assertLocalPasswordPolicy(password);
  }

  validateCustomer(email: string, password: string) {
    return this.credentialsService.validateCustomer(email, password);
  }

  validateEmployee(email: string, password: string) {
    return this.credentialsService.validateEmployee(email, password);
  }

  generateCustomerToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    group?: { name: string; reduction: unknown } | null;
  }) {
    return this.tokenService.generateCustomerToken(customer);
  }

  generateEmployeeToken(employee: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    return this.tokenService.generateEmployeeToken(employee);
  }

  verifyToken(token: string) {
    return this.tokenService.verifyToken(token);
  }

  async refreshToken(
    token: string,
    expectedType?: 'customer' | 'employee',
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const result = await this.tokenService.refreshToken(token, expectedType);
    const isCustomer = 'customer' in result;
    const actorId = isCustomer ? result.customer.id : result.employee.id;
    const actorType = expectedType || (isCustomer ? 'customer' : 'employee');
    await this.audit({
      action: `${actorType}.refresh_token`,
      actorType: actorType as any,
      actorId,
      metadata: { oldJti: result.oldJti ?? null, newJti: result.jti },
      ...meta,
    });
    return result;
  }

  logout(userId: string, jti?: string, exp?: number) {
    return this.tokenService.logout(userId, jti, exp);
  }

  sendCustomerMagicLink(email: string, magicLink: string): Promise<void> {
    return this.recoveryService.sendCustomerMagicLink(email, magicLink);
  }

  generateCustomerMagicLinkToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  }) {
    return this.recoveryService.generateCustomerMagicLinkToken(customer);
  }

  verifyCustomerMagicLink(token: string) {
    return this.recoveryService.verifyCustomerMagicLink(token);
  }

  generateEmployeePasswordResetToken(employee: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    return this.recoveryService.generateEmployeePasswordResetToken(employee);
  }

  completeForcedPasswordReset(token: string, password: string) {
    return this.recoveryService.completeForcedPasswordReset(token, password);
  }

  trustEmployeeDevice(employeeId: string, label?: string) {
    return this.trustedDeviceService.trustEmployeeDevice(employeeId, label);
  }

  verifyTrustedEmployeeDevice(employeeId: string, token?: string | null) {
    return this.trustedDeviceService.verifyTrustedEmployeeDevice(
      employeeId,
      token,
    );
  }

  createOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string,
    codeChallenge: string,
    state: string,
  ) {
    return this.oauthService.createOAuthAuthorizationUrl(
      provider,
      redirectUri,
      codeChallenge,
      state,
    );
  }

  loginCustomerWithOAuth2(
    provider: OAuthProvider,
    authorizationCode: string,
    codeVerifier: string,
    redirectUri: string,
  ) {
    return this.oauthService.loginCustomerWithOAuth2(
      provider,
      authorizationCode,
      codeVerifier,
      redirectUri,
    );
  }

  audit(input: AuditInput) {
    return this.auditService.audit(input);
  }

  detectSessionAnomaly(input: SessionAnomalyInput) {
    return this.auditService.detectSessionAnomaly(input);
  }

  generateTwoFactorSecret(email: string) {
    return this.twoFactorService.generateSecret(email);
  }

  generateQrCodeDataURL(otpauthUrl: string) {
    return this.twoFactorService.generateQrCodeDataURL(otpauthUrl);
  }

  verifyTwoFactorToken(secret: string, token: string) {
    return this.twoFactorService.verifyToken(secret, token);
  }
}
