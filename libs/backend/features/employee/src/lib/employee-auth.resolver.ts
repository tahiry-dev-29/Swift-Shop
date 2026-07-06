import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthRateLimitGuard, EmployeeGuard } from '@swift-shop/backend/auth';
import {
  EmployeeAuthResponse,
  EmployeeType,
  TwoFactorGenerateResponse,
} from './dto';
import { EmployeeAuthFlowService } from './employee-auth-flow.service';
import { EmployeeGraphQLContext } from './employee-auth-flow.types';

@Resolver()
export class EmployeeAuthResolver {
  constructor(private readonly authFlow: EmployeeAuthFlowService) {}

  @Mutation(() => EmployeeAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async employeeLogin(
    @Context() context: EmployeeGraphQLContext,
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('totp', { nullable: true }) totp?: string,
    @Args('trustedDeviceToken', { nullable: true })
    trustedDeviceToken?: string,
    @Args('rememberDevice', { nullable: true }) rememberDevice?: boolean,
  ) {
    return this.authFlow.login({
      context,
      email,
      password,
      totp,
      trustedDeviceToken,
      rememberDevice,
    });
  }

  @Mutation(() => TwoFactorGenerateResponse)
  @UseGuards(EmployeeGuard)
  async generateEmployeeTwoFactor(
    @Context() ctx: { req: { user: { id: string } } },
  ) {
    return this.authFlow.generateTwoFactor(ctx.req.user.id);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(EmployeeGuard)
  async enableEmployeeTwoFactor(
    @Context() ctx: { req: { user: { id: string } } },
    @Args('totp') totp: string,
  ) {
    return this.authFlow.enableTwoFactor(ctx.req.user.id, totp);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(EmployeeGuard)
  async disableEmployeeTwoFactor(
    @Context() ctx: { req: { user: { id: string } } },
    @Args('totp') totp: string,
  ) {
    return this.authFlow.disableTwoFactor(ctx.req.user.id, totp);
  }

  @Mutation(() => EmployeeAuthResponse)
  async completeEmployeeForcedPasswordReset(
    @Args('token') token: string,
    @Args('password') password: string,
  ) {
    return this.authFlow.completeForcedPasswordReset(token, password);
  }

  @Mutation(() => EmployeeAuthResponse)
  async employeeRefreshToken(@Args('token') token: string) {
    return this.authFlow.refreshToken(token);
  }

  @Mutation(() => Boolean)
  @UseGuards(EmployeeGuard)
  async employeeLogout(
    @Context()
    ctx: {
      req: { user: { id: string; jti?: string; exp?: number } };
    },
  ) {
    return this.authFlow.logout(ctx.req.user);
  }
}
