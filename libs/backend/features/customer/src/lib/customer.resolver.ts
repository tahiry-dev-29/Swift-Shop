import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  AuthRateLimitGuard,
  AuthService,
  CustomerGuard,
  EmployeeGuard,
} from '@dima-new/backend/auth';
import {
  CustomerType,
  CustomerAuthResponse,
  CustomerRegisterInput,
  MagicLinkResponse,
  OAuthAuthorizationResponse,
} from './dto';
import { CartService } from '@dima-new/backend/cart';

interface GraphQLContext {
  req: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
  };
}

type OAuthProvider = 'google' | 'facebook';

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
  if (!host) {
    return undefined;
  }
  const protocol =
    headerValue(context.req.headers['x-forwarded-proto']) ?? 'http';
  return `${protocol}://${host}`;
}

@Resolver()
export class CustomerResolver {
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
    const customer = await this.authService.validateCustomer(email, password);
    if (!customer) {
      await this.authService.audit({
        action: 'customer.login_failed',
        actorType: 'customer',
        metadata: { email },
        ...requestMeta(context),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.authService.generateCustomerToken(customer);

    const sessionId = context.req?.headers?.['x-session-id'];
    if (sessionId) {
      await this.cartService.mergeGuestCart(
        Array.isArray(sessionId) ? sessionId[0] : sessionId,
        customer.id,
      );
    }

    await this.authService.audit({
      action: 'customer.login_success',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
      ...requestMeta(context),
    });

    return { ...token, customer };
  }

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerRegister(@Args('input') input: CustomerRegisterInput) {
    const existing = await this.customerService.findByEmail(input.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const customer = await this.customerService.register(input);
    const token = this.authService.generateCustomerToken(customer);
    await this.authService.audit({
      action: 'customer.registered',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
    });
    return { ...token, customer };
  }

  @Mutation(() => MagicLinkResponse)
  @UseGuards(AuthRateLimitGuard)
  async requestCustomerMagicLink(
    @Context() context: GraphQLContext,
    @Args('email') email: string,
  ) {
    const customer = await this.customerService.findByEmail(email);
    if (!customer || !customer.active) {
      return { sent: true };
    }
    const token = this.authService.generateCustomerMagicLinkToken(customer);
    const path = `/auth/customer/magic-link?token=${encodeURIComponent(token)}`;
    const baseUrl = publicBaseUrl(context);
    const magicLink = baseUrl ? `${baseUrl}${path}` : path;
    await this.authService.sendCustomerMagicLink(customer.email, magicLink);
    await this.authService.audit({
      action: 'customer.magic_link_requested',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
      ...requestMeta(context),
    });
    return { sent: true, magicLink };
  }

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerLoginWithMagicLink(
    @Context() context: GraphQLContext,
    @Args('token') token: string,
  ) {
    const customer = await this.authService.verifyCustomerMagicLink(token);
    if (!customer) {
      throw new UnauthorizedException('Invalid magic link');
    }
    const authToken = this.authService.generateCustomerToken(customer);
    await this.authService.audit({
      action: 'customer.magic_link_login_success',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
      ...requestMeta(context),
    });
    return { ...authToken, customer };
  }

  @Query(() => OAuthAuthorizationResponse)
  async customerOAuth2AuthorizationUrl(
    @Args('provider') provider: OAuthProvider,
    @Args('redirectUri') redirectUri: string,
    @Args('codeChallenge') codeChallenge: string,
    @Args('state') state: string,
  ) {
    return {
      authorizationUrl: await this.authService.createOAuthAuthorizationUrl(
        provider,
        redirectUri,
        codeChallenge,
        state,
      ),
    };
  }

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerOAuth2Login(
    @Context() context: GraphQLContext,
    @Args('provider') provider: OAuthProvider,
    @Args('authorizationCode') authorizationCode: string,
    @Args('codeVerifier') codeVerifier: string,
    @Args('redirectUri') redirectUri: string,
  ) {
    const customer = await this.authService.loginCustomerWithOAuth2(
      provider,
      authorizationCode,
      codeVerifier,
      redirectUri,
    );
    const token = this.authService.generateCustomerToken(customer);
    await this.authService.audit({
      action: 'customer.oauth2_login_success',
      actorType: 'customer',
      actorId: customer.id,
      customerId: customer.id,
      metadata: { provider },
      ...requestMeta(context),
    });
    return { ...token, customer };
  }

  @Query(() => CustomerType)
  @UseGuards(CustomerGuard)
  async customerMe(@Context() ctx: { req: { user: { id: string } } }) {
    const customer = await this.customerService.findById(ctx.req.user.id);
    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }
    return customer;
  }

  @Query(() => [CustomerType])
  @UseGuards(EmployeeGuard)
  async customers() {
    return this.customerService.findAll();
  }
}
