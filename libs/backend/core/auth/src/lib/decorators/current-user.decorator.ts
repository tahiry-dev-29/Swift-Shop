import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface AuthUser {
  id: number;
  email: string;
  type: 'customer' | 'employee';
  firstname: string;
  lastname: string;
  role?: string;
  groupName?: string;
  groupReduction?: number;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthUser => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request.user;
  }
);
