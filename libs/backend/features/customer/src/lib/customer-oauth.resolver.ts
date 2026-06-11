import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuthRateLimitGuard, AuthService } from '@dima-new/backend/auth';
import { CustomerAuthResponse, OAuthAuthorizationResponse } from './dto';

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

@Resolver()
export class CustomerOAuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => OAuthAuthorizationResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerOAuth2AuthorizationUrl(
    @Args('provider') provider: OAuthProvider,
    @Args('redirectUri') redirectUri: string,
    @Args('codeChallenge') codeChallenge: string,
    @Args('state', { nullable: true }) state?: string,
  ) {
    const resolvedState = state ?? randomBytes(32).toString('base64url');
    const authorizationUrl = await this.authService.createOAuthAuthorizationUrl(
      provider,
      redirectUri,
      codeChallenge,
      resolvedState,
    );
    return { authorizationUrl, state: resolvedState };
  }

  @Mutation(() => CustomerAuthResponse)
  @UseGuards(AuthRateLimitGuard)
  async customerOAuth2Login(
    @Context() context: GraphQLContext,
    @Args('provider') provider: OAuthProvider,
    @Args('code') code: string,
    @Args('codeVerifier') codeVerifier: string,
    @Args('redirectUri') redirectUri: string,
  ) {
    const customer = await this.authService.loginCustomerWithOAuth2(
      provider,
      code,
      codeVerifier,
      redirectUri,
    );
    const token = await this.authService.generateCustomerToken(customer);
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
}
