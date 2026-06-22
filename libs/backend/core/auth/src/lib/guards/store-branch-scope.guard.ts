import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  STORE_BRANCH_SCOPE_KEY,
  StoreBranchScopeOptions,
} from '../decorators/require-store-branch-scope.decorator';
import { EmployeeGuard } from './employee-guard';

type RequestWithUser = {
  user?: {
    id?: string;
    type?: 'customer' | 'employee';
    role?: string;
  };
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

@Injectable()
export class StoreBranchScopeGuard
  extends EmployeeGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const authenticated = await super.canActivate(context);
    if (!authenticated) {
      return false;
    }

    const options =
      this.reflector.getAllAndOverride<StoreBranchScopeOptions>(
        STORE_BRANCH_SCOPE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? {};

    const { request, args } = this.getRequestAndArgs(context);
    const user = request.user;
    if (!user?.id || user.type !== 'employee') {
      throw new ForbiddenException('Employee branch scope required');
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'SuperAdmin') {
      return true;
    }

    const branchId = this.resolveBranchId(options.branchIdArg, request, args);
    if (!branchId) {
      throw new ForbiddenException('Store branch scope is missing');
    }

    const assignment = await this.prisma.employeeStoreBranch.count({
      where: {
        employeeId: user.id,
        branchId,
        branch: { active: true, deletedAt: null },
      },
    });
    if (assignment === 0) {
      throw new ForbiddenException('Store branch access denied');
    }
    return true;
  }

  private getRequestAndArgs(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return {
        request: context.switchToHttp().getRequest<RequestWithUser>(),
        args: undefined,
      };
    }

    const gqlContext = GqlExecutionContext.create(context);
    return {
      request: gqlContext.getContext<{ req: RequestWithUser }>().req,
      args: gqlContext.getArgs<Record<string, unknown>>(),
    };
  }

  private resolveBranchId(
    branchIdArg: string | undefined,
    request: RequestWithUser,
    args?: Record<string, unknown>,
  ) {
    const key = branchIdArg ?? 'branchId';
    return (
      this.readString(args, key) ??
      this.readString(request.body, key) ??
      this.readString(request.params, key) ??
      this.readString(request.query, key)
    );
  }

  private readString(source: Record<string, unknown> | undefined, key: string) {
    const value = source?.[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
