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

    const token = await this.authService.generateEmployeeToken(employee);
    return { ...token, employee };
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

  @Mutation(() => EmployeeAuthResponse)
  async employeeRefreshToken(@Args('token') token: string) {
    const result = await this.authService.refreshToken(token);
    return result;
  }

  @Mutation(() => Boolean)
  @UseGuards(EmployeeGuard)
  async employeeLogout(@Context() ctx: { req: { user: { id: string, jti?: string, exp?: number } } }) {
    const user = ctx.req.user;
    await this.authService.logout(user.id, user.jti, user.exp);
    return true;
  }
}
