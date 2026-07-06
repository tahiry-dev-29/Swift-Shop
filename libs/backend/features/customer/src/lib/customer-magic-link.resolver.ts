import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthRateLimitGuard, AuthService } from '@swift-shop/backend/auth';
import { CustomerService } from './customer.service';
import { CustomerAuthResponse, MagicLinkResponse } from './dto';

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

function publicBaseUrl(context: GraphQLContext): string | undefined {
  const host =
    headerValue(context.req.headers['x-forwarded-host']) ??
    headerValue(context.req.headers.host);
  if (!host) return undefined;
  const protocol =
    headerValue(context.req.headers['x-forwarded-proto']) ?? 'http';
  return `${protocol}://${host}`;
}

@Resolver()
export class CustomerMagicLinkResolver {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => MagicLinkResponse)
  @UseGuards(AuthRateLimitGuard)
  async requestCustomerMagicLink(
    @Context() context: GraphQLContext,
    @Args('email') email: string,
  ) {
    const customer = await this.customerService.findByEmail(email);
    if (customer?.active) {
      const token = this.authService.generateCustomerMagicLinkToken(customer);
      const baseUrl = publicBaseUrl(context) ?? 'http://localhost:4200';
      const magicLink = `${baseUrl}/auth/magic-link?token=${encodeURIComponent(
        token,
      )}`;
      await this.authService.sendCustomerMagicLink(customer.email, magicLink);
      await this.authService.audit({
        action: 'customer.magic_link_requested',
        actorType: 'customer',
        actorId: customer.id,
        customerId: customer.id,
        ...requestMeta(context),
      });
    }
    return { sent: true };
  }

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerLoginWithMagicLink(
    @Context() context: GraphQLContext,
    @Args('token') token: string,
  ) {
    const customer = await this.authService.verifyCustomerMagicLink(token);
    if (!customer) throw new UnauthorizedException('Invalid magic link');
    const authToken = await this.authService.generateCustomerToken(customer);
    await this.authService.audit({
      action: 'customer.magic_link_login_success',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
      ...requestMeta(context),
    });
    return { ...authToken, customer };
  }
}
