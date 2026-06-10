import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '@dima-new/data-access-prisma';
import { JwtPayload } from '@dima-new/models';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { toDataURL } from 'qrcode';
import { AuthMailService } from './auth-mail.service';
import { RedisService } from './redis.service';
import {
  pwnedPasswordRangeIncludesSuffix,
  sha1PasswordParts,
  validateLocalPasswordPolicy,
} from './password-policy';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const MAGIC_LINK_TTL = '15m';
const PASSWORD_RESET_TTL = '15m';
const DEVICE_TRUST_DAYS = 30;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type AuditInput = RequestMeta & {
  action: string;
  actorType?: 'customer' | 'employee' | 'system';
  actorId?: string;
  customerId?: string;
  employeeId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type OAuthProvider = 'google' | 'facebook';

type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  firstname: string;
  lastname: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: AuthMailService,
    private readonly redisService: RedisService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    await this.assertPasswordPolicy(password);
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

    if (!customer || !customer.active || this.isLocked(customer.lockedUntil)) {
      return null;
    }

    const isValid = await this.verifyPassword(customer.password, password);
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

    const isValid = await this.verifyPassword(employee.password, password);
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

  async generateCustomerToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    group?: { name: string; reduction: unknown } | null;
  }) {
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
      purpose: 'access',
      firstname: customer.firstname,
      lastname: customer.lastname,
      groupName: customer.group?.name,
      groupReduction: customer.group?.reduction
        ? Number(customer.group.reduction)
        : undefined,
      jti,
      tokenType: 'access',
    };

    const refreshTokenPayload: JwtPayload = {
      ...payload,
      tokenType: 'refresh',
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '7d',
    });

    await this.redisService.storeRefreshToken(
      customer.id,
      jti,
      REFRESH_TOKEN_TTL_SECONDS,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async generateEmployeeToken(employee: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      type: 'employee',
      purpose: 'access',
      firstname: employee.firstname,
      lastname: employee.lastname,
      role: employee.role.name,
      jti,
      tokenType: 'access',
    };

    const refreshTokenPayload: JwtPayload = {
      ...payload,
      tokenType: 'refresh',
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '7d',
    });

    await this.redisService.storeRefreshToken(
      employee.id,
      jti,
      REFRESH_TOKEN_TTL_SECONDS,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload.purpose && payload.purpose !== 'access' ? null : payload;
    } catch {
      return null;
    }
  }

  async refreshToken(token: string) {
    const payload = this.jwtService.verify<JwtPayload>(token);

    if (payload.tokenType !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isBlacklisted = await this.redisService.isTokenBlacklisted(
      payload.jti,
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const storedJti = await this.redisService.getStoredRefreshTokenJti(
      payload.sub,
    );
    if (storedJti !== payload.jti) {
      throw new UnauthorizedException('Refresh token is no longer active');
    }

    const expiresIn = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : REFRESH_TOKEN_TTL_SECONDS;
    if (expiresIn > 0) {
      await this.redisService.setBlacklistToken(payload.jti, expiresIn);
    }

    if (payload.type === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
        include: { group: true },
      });
      if (!customer || !customer.active) {
        throw new UnauthorizedException('User inactive');
      }
      const tokens = await this.generateCustomerToken(customer);
      return { ...tokens, customer };
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!employee || !employee.active) {
      throw new UnauthorizedException('User inactive');
    }
    const tokens = await this.generateEmployeeToken(employee);
    return { ...tokens, employee };
  }

  async logout(userId: string, jti?: string, exp?: number) {
    await this.redisService.storeRefreshToken(userId, '', 1);

    if (!jti || !exp) {
      return;
    }

    const expiresIn = exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await this.redisService.setBlacklistToken(jti, expiresIn);
    }
  }

  async assertPasswordPolicy(password: string): Promise<void> {
    this.assertLocalPasswordPolicy(password);
    await this.assertPasswordNotPwned(password);
  }

  assertLocalPasswordPolicy(password: string): void {
    validateLocalPasswordPolicy(password);
  }

  async sendCustomerMagicLink(email: string, magicLink: string): Promise<void> {
    await this.mailService.sendCustomerMagicLink(email, magicLink);
  }

  generateCustomerMagicLinkToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  }) {
    const payload: JwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
      purpose: 'customer_magic_link',
      firstname: customer.firstname,
      lastname: customer.lastname,
    };
    return this.jwtService.sign(payload, { expiresIn: MAGIC_LINK_TTL });
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
    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      type: 'employee',
      purpose: 'employee_password_reset',
      firstname: employee.firstname,
      lastname: employee.lastname,
      role: employee.role.name,
    };
    return this.jwtService.sign(payload, { expiresIn: PASSWORD_RESET_TTL });
  }

  async completeForcedPasswordReset(token: string, password: string) {
    await this.assertPasswordPolicy(password);
    const payload = this.jwtService.verify<JwtPayload>(token);
    if (
      payload.type !== 'employee' ||
      payload.purpose !== 'employee_password_reset'
    ) {
      return null;
    }
    const hashedPassword = await argon2.hash(password);
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

  async trustEmployeeDevice(employeeId: string, label?: string) {
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + DEVICE_TRUST_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.trustedDevice.create({
      data: {
        employeeId,
        tokenHash: this.hashToken(rawToken),
        label,
        expiresAt,
      },
    });
    return rawToken;
  }

  async verifyTrustedEmployeeDevice(employeeId: string, token?: string | null) {
    if (!token) {
      return false;
    }
    const device = await this.prisma.trustedDevice.findFirst({
      where: {
        employeeId,
        tokenHash: this.hashToken(token),
        expiresAt: { gt: new Date() },
      },
    });
    if (!device) {
      return false;
    }
    await this.prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });
    return true;
  }

  async createOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string,
    codeChallenge: string,
    state: string,
  ) {
    const config = this.getOAuthConfig(provider);
    const url = new URL(config.authorizationUrl);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', config.scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return url.toString();
  }

  async loginCustomerWithOAuth2(
    provider: OAuthProvider,
    authorizationCode: string,
    codeVerifier: string,
    redirectUri: string,
  ) {
    const profile = await this.fetchOAuthProfile(
      provider,
      authorizationCode,
      codeVerifier,
      redirectUri,
    );
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { customer: { include: { group: true } } },
    });
    if (existingAccount) {
      return existingAccount.customer;
    }

    const group = await this.prisma.customerGroup.findFirst({
      orderBy: { name: 'asc' },
    });
    if (!group) {
      throw new Error('Default customer group missing');
    }

    const customer = await this.prisma.customer.upsert({
      where: { email: profile.email },
      update: {},
      create: {
        email: profile.email,
        password: await argon2.hash(randomBytes(32).toString('base64url')),
        firstname: profile.firstname,
        lastname: profile.lastname,
        groupId: group.id,
      },
      include: { group: true },
    });

    await this.prisma.oAuthAccount.create({
      data: {
        provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        customerId: customer.id,
      },
    });

    return customer;
  }

  async audit(input: AuditInput) {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        actorType: input.actorType,
        actorId: input.actorId,
        customerId: input.customerId,
        employeeId: input.employeeId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }

  generateTwoFactorSecret(email: string) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: 'Store Admin',
      label: email,
      secret,
    });
    return { secret, otpauthUrl };
  }

  async generateQrCodeDataURL(otpauthUrl: string) {
    return toDataURL(otpauthUrl);
  }

  verifyTwoFactorToken(secret: string, token: string) {
    return verifySync({ token, secret }).valid;
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
      await this.sendAccountLockoutAlert({
        email: customer.email,
        accountType: 'customer',
        lockedUntil,
      });
    }
  }

  private async clearCustomerFailedLogins(id: string) {
    await this.prisma.customer.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
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
      await this.sendAccountLockoutAlert({
        email: employee.email,
        accountType: 'employee',
        lockedUntil,
      });
    }
  }

  private async clearEmployeeFailedLogins(id: string) {
    await this.prisma.employee.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendAccountLockoutAlert(input: {
    email: string;
    accountType: 'customer' | 'employee';
    lockedUntil: Date;
  }): Promise<void> {
    try {
      await this.mailService.sendAccountLockoutAlert(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Account lockout email failed: ${message}`);
    }
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

  private getOAuthConfig(provider: OAuthProvider) {
    if (provider === 'google') {
      return {
        clientId: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.getOrThrow<string>(
          'GOOGLE_CLIENT_SECRET',
        ),
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scope: 'openid email profile',
      };
    }
    return {
      clientId: this.configService.getOrThrow<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>(
        'FACEBOOK_CLIENT_SECRET',
      ),
      authorizationUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      profileUrl:
        'https://graph.facebook.com/me?fields=id,email,first_name,last_name',
      scope: 'email,public_profile',
    };
  }

  private async fetchOAuthProfile(
    provider: OAuthProvider,
    authorizationCode: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<OAuthProfile> {
    const config = this.getOAuthConfig(provider);
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: authorizationCode,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error('OAuth token exchange failed');
    }
    const tokenBody = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenBody.access_token) {
      throw new Error('OAuth provider did not return an access token');
    }
    const profileResponse = await fetch(config.profileUrl, {
      headers: { authorization: `Bearer ${tokenBody.access_token}` },
    });
    if (!profileResponse.ok) {
      throw new Error('OAuth profile fetch failed');
    }
    const profile = (await profileResponse.json()) as {
      sub?: string;
      id?: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      first_name?: string;
      last_name?: string;
    };
    const providerAccountId = profile.sub ?? profile.id;
    if (!providerAccountId || !profile.email) {
      throw new Error('OAuth profile is missing required identity fields');
    }
    return {
      provider,
      providerAccountId,
      email: profile.email,
      firstname: profile.given_name ?? profile.first_name ?? 'Customer',
      lastname: profile.family_name ?? profile.last_name ?? 'OAuth',
    };
  }
}
