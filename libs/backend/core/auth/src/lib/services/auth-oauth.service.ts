import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { OAuthProfile, OAuthProvider } from '../types/auth-types.internal';
import { PasswordSecurityService } from './password-security.service';

@Injectable()
export class AuthOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly passwordSecurity: PasswordSecurityService,
  ) {}

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
    const account = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { customer: { include: { group: true } } },
    });
    if (account) {
      return account.customer;
    }
    return this.createCustomerFromOAuth(profile);
  }

  private async createCustomerFromOAuth(profile: OAuthProfile) {
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
        password: await this.passwordSecurity.hashWithoutPolicy(
          randomBytes(32).toString('base64url'),
        ),
        firstname: profile.firstname,
        lastname: profile.lastname,
        groupId: group.id,
      },
      include: { group: true },
    });

    await this.prisma.oAuthAccount.create({
      data: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        customerId: customer.id,
      },
    });
    return customer;
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
    if (!tokenResponse.ok) throw new Error('OAuth token exchange failed');
    const tokenBody = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenBody.access_token) {
      throw new Error('OAuth provider did not return an access token');
    }
    return this.fetchProfile(
      provider,
      config.profileUrl,
      tokenBody.access_token,
    );
  }

  private async fetchProfile(
    provider: OAuthProvider,
    profileUrl: string,
    accessToken: string,
  ): Promise<OAuthProfile> {
    const response = await fetch(profileUrl, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('OAuth profile fetch failed');
    const profile = (await response.json()) as {
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
