import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import {
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import {
  AuthRateLimitGuard,
  AuthService,
  EmployeeGuard,
  SuperAdminGuard,
} from '@dima-new/backend/auth';
import {
  EmployeeType,
  EmployeeAuthResponse,
  TwoFactorGenerateResponse,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from './dto';

interface GraphQLContext {
  req: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
  };
  res?: {
    cookie: (name: string, value: string, options: TrustedDeviceCookie) => void;
  };
}

type TrustedDeviceCookie = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  maxAge: number;
  path: string;
};

const TRUSTED_DEVICE_COOKIE_NAME = 'dima_trusted_employee_device';
const TRUSTED_DEVICE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function requestMeta(context: GraphQLContext) {
  return {
    ipAddress:
      headerValue(context.req.headers['x-forwarded-for']) ?? context.req.ip,
    userAgent: headerValue(context.req.headers['user-agent']),
  };
}

function cookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function trustedDeviceCookieOptions(): TrustedDeviceCookie {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: TRUSTED_DEVICE_COOKIE_MAX_AGE,
    path: '/',
  };
}

@Resolver()
export class EmployeeResolver {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => EmployeeAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async employeeLogin(
    @Context() context: GraphQLContext,
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('totp', { nullable: true }) totp?: string,
    @Args('trustedDeviceToken', { nullable: true })
    trustedDeviceToken?: string,
    @Args('rememberDevice', { nullable: true }) rememberDevice?: boolean,
  ) {
    const employee = await this.authService.validateEmployee(email, password);
    if (!employee) {
      await this.authService.audit({
        action: 'employee.login_failed',
        actorType: 'employee',
        metadata: { email },
        ...requestMeta(context),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isTrustedDevice = await this.authService.verifyTrustedEmployeeDevice(
      employee.id,
      trustedDeviceToken ??
        cookieValue(
          headerValue(context.req.headers.cookie),
          TRUSTED_DEVICE_COOKIE_NAME,
        ),
    );

    if (employee.twoFactorEnabled) {
      if (!totp && !isTrustedDevice) {
        return { requires2FA: true };
      }
      if (!isTrustedDevice) {
        if (!employee.twoFactorSecret) {
          throw new UnauthorizedException('2FA configuration error');
        }
        if (
          !totp ||
          !this.authService.verifyTwoFactorToken(employee.twoFactorSecret, totp)
        ) {
          throw new UnauthorizedException('Invalid TOTP token');
        }
      }
    }

    if (employee.forcePasswordReset) {
      return {
        requiresPasswordReset: true,
        passwordResetToken:
          this.authService.generateEmployeePasswordResetToken(employee),
      };
    }

    const token = this.authService.generateEmployeeToken(employee);
    const newTrustedDeviceToken =
      rememberDevice && employee.twoFactorEnabled
        ? await this.authService.trustEmployeeDevice(employee.id)
        : undefined;
    if (newTrustedDeviceToken) {
      context.res?.cookie(
        TRUSTED_DEVICE_COOKIE_NAME,
        newTrustedDeviceToken,
        trustedDeviceCookieOptions(),
      );
    }
    await this.authService.audit({
      action: 'employee.login_success',
      actorType: 'employee',
      actorId: employee.id,
      employeeId: employee.id,
      ...requestMeta(context),
    });
    return {
      ...token,
      employee,
      requires2FA: false,
      requiresPasswordReset: false,
      trustedDeviceToken: newTrustedDeviceToken,
    };
  }

  @Mutation(() => EmployeeAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async completeEmployeeForcedPasswordReset(
    @Context() context: GraphQLContext,
    @Args('token') token: string,
    @Args('password') password: string,
  ) {
    const employee = await this.authService.completeForcedPasswordReset(
      token,
      password,
    );
    if (!employee) {
      throw new UnauthorizedException('Invalid password reset token');
    }
    const accessToken = this.authService.generateEmployeeToken(employee);
    await this.authService.audit({
      action: 'employee.password_reset_completed',
      actorType: 'employee',
      actorId: employee.id,
      employeeId: employee.id,
      ...requestMeta(context),
    });
    return {
      ...accessToken,
      employee,
      requires2FA: false,
      requiresPasswordReset: false,
    };
  }

  @Mutation(() => TwoFactorGenerateResponse)
  @UseGuards(EmployeeGuard)
  async generate2FASecret(
    @Context() ctx: { req: { user: { id: string; email: string } } },
  ) {
    const { secret, otpauthUrl } = this.authService.generateTwoFactorSecret(
      ctx.req.user.email,
    );
    const qrCodeUrl = await this.authService.generateQrCodeDataURL(otpauthUrl);
    await this.employeeService.update(ctx.req.user.id, {
      twoFactorSecret: secret,
    });
    return { secret, qrCodeUrl };
  }

  @Mutation(() => Boolean)
  @UseGuards(EmployeeGuard)
  async enable2FA(
    @Context() ctx: { req: { user: { id: string } } },
    @Args('token') token: string,
  ) {
    const employee = await this.employeeService.findById(ctx.req.user.id);
    if (!employee || !employee.twoFactorSecret) {
      throw new UnauthorizedException(
        'No 2FA secret found. Generate one first.',
      );
    }
    const isValid = this.authService.verifyTwoFactorToken(
      employee.twoFactorSecret,
      token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP token');
    }
    await this.employeeService.update(ctx.req.user.id, {
      twoFactorEnabled: true,
    });
    await this.authService.audit({
      action: 'employee.2fa_enabled',
      actorType: 'employee',
      actorId: ctx.req.user.id,
      employeeId: ctx.req.user.id,
    });
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(EmployeeGuard)
  async disable2FA(
    @Context() ctx: { req: { user: { id: string } } },
    @Args('token') token: string,
  ) {
    const employee = await this.employeeService.findById(ctx.req.user.id);
    if (!employee || !employee.twoFactorEnabled) {
      return true;
    }
    if (!employee.twoFactorSecret) {
      throw new UnauthorizedException('No 2FA secret configured.');
    }
    const isValid = this.authService.verifyTwoFactorToken(
      employee.twoFactorSecret,
      token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP token');
    }
    await this.employeeService.update(ctx.req.user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    await this.authService.audit({
      action: 'employee.2fa_disabled',
      actorType: 'employee',
      actorId: ctx.req.user.id,
      employeeId: ctx.req.user.id,
    });
    return true;
  }

  @Query(() => EmployeeType)
  @UseGuards(EmployeeGuard)
  async employeeMe(@Context() ctx: { req: { user: { id: string } } }) {
    const employee = await this.employeeService.findById(ctx.req.user.id);
    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }
    return employee;
  }

  @Query(() => [EmployeeType])
  @UseGuards(SuperAdminGuard)
  async employees() {
    return this.employeeService.findAll();
  }

  @Query(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async employee(@Args('id', { type: () => ID }) id: string) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return employee;
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async createEmployee(@Args('input') input: CreateEmployeeInput) {
    const existing = await this.employeeService.findByEmail(input.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }
    return this.employeeService.create(input);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async updateEmployee(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmployeeInput,
  ) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return this.employeeService.update(id, input);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async deleteEmployee(@Args('id', { type: () => ID }) id: string) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return this.employeeService.delete(id);
  }
}
