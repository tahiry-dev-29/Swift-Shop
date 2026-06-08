import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  InjectThrottlerStorage,
  ThrottlerException,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { createHash } from 'crypto';
import { Request } from 'express';
import {
  AUTH_RATE_LIMIT_BLOCK_MS,
  AUTH_RATE_LIMIT_EMAIL_ATTEMPTS,
  AUTH_RATE_LIMIT_IP_ATTEMPTS,
  AUTH_RATE_LIMIT_TTL_MS,
} from './rate-limit.constants';

type AuthRateLimitInput = {
  email?: string;
  input?: {
    email?: string;
  };
};

type GraphQLRequestContext = {
  req: Request;
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    @InjectThrottlerStorage()
    private readonly storage: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const requestContext = gqlContext.getContext<GraphQLRequestContext>();
    const args = gqlContext.getArgs<AuthRateLimitInput>();
    const operation = context.getHandler().name;
    const ipTracker = this.getIpTracker(requestContext.req);
    const emailTracker = this.getEmailTracker(args);

    await this.checkLimit(
      `${operation}:ip:${ipTracker}`,
      AUTH_RATE_LIMIT_IP_ATTEMPTS,
    );
    await this.checkLimit(
      `${operation}:email:${emailTracker}`,
      AUTH_RATE_LIMIT_EMAIL_ATTEMPTS,
    );

    return true;
  }

  private async checkLimit(tracker: string, limit: number): Promise<void> {
    const key = createHash('sha256').update(tracker).digest('hex');
    const record = await this.storage.increment(
      key,
      AUTH_RATE_LIMIT_TTL_MS,
      limit,
      AUTH_RATE_LIMIT_BLOCK_MS,
      'auth',
    );

    if (record.isBlocked) {
      throw new ThrottlerException(
        `Too many authentication attempts. Try again in ${record.timeToBlockExpire} seconds.`,
      );
    }
  }

  private getIpTracker(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] ?? this.getRequestIp(request);
    }

    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim() ?? this.getRequestIp(request);
    }

    return this.getRequestIp(request);
  }

  private getRequestIp(request: Request): string {
    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }

  private getEmailTracker(args: AuthRateLimitInput): string {
    return (args.email ?? args.input?.email ?? 'unknown').trim().toLowerCase();
  }
}
