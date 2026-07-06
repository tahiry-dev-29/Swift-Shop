import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { CartService } from '@swift-shop/backend/cart';
import { AuthRateLimitGuard, AuthService } from '@swift-shop/backend/auth';
import { CustomerService } from './customer.service';
import { CustomerAuthResponse, CustomerRegisterInput } from './dto';

interface GraphQLContext {
  req: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
  };
}

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

@Resolver()
export class CustomerAuthResolver {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
    private readonly cartService: CartService,
  ) {}

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerLogin(
    @Context() context: GraphQLContext,
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    const meta = requestMeta(context);
    const customer = await this.authService.validateCustomer(email, password);
    if (!customer) {
      await this.authService.audit({
        action: 'customer.login_failed',
        actorType: 'customer',
        metadata: { email },
        ...meta,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.authService.generateCustomerToken(customer);
    await this.mergeGuestCartIfNeeded(context, customer.id);
    await this.auditSuccessfulLogin(context, customer.id);
    return { ...token, customer };
  }

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerRegister(
    @Context() context: GraphQLContext,
    @Args('input') input: CustomerRegisterInput,
  ) {
    const existing = await this.customerService.findByEmail(input.email);
    if (existing) throw new UnauthorizedException('Email already in use');

    const customer = await this.customerService.register(input);
    const token = await this.authService.generateCustomerToken(customer);
    await this.authService.audit({
      action: 'customer.register_success',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
      ...requestMeta(context),
    });
    return { ...token, customer };
  }

  private async mergeGuestCartIfNeeded(
    context: GraphQLContext,
    customerId: string,
  ) {
    const sessionId = context.req?.headers?.['x-session-id'];
    if (sessionId) {
      await this.cartService.mergeGuestCart(
        Array.isArray(sessionId) ? sessionId[0] : sessionId,
        customerId,
      );
    }
  }

  private async auditSuccessfulLogin(
    context: GraphQLContext,
    customerId: string,
  ) {
    const meta = requestMeta(context);
    const anomaly = await this.authService.detectSessionAnomaly({
      actorType: 'customer',
      actorId: customerId,
      ...meta,
    });
    await this.authService.audit({
      action: 'customer.login_success',
      actorType: 'customer',
      actorId: customerId,
      customerId,
      metadata: {
        sessionAnomaly: anomaly.detected,
        ipAddressChanged: anomaly.ipAddressChanged,
        userAgentChanged: anomaly.userAgentChanged,
      },
      ...meta,
    });
    if (anomaly.detected) {
      await this.authService.audit({
        action: 'customer.session_anomaly',
        actorType: 'customer',
        actorId: customerId,
        customerId,
        metadata: {
          ipAddressChanged: anomaly.ipAddressChanged,
          userAgentChanged: anomaly.userAgentChanged,
          previousIpAddress: anomaly.previousIpAddress ?? null,
          previousUserAgent: anomaly.previousUserAgent ?? null,
        },
        ...meta,
      });
    }
  }
}
