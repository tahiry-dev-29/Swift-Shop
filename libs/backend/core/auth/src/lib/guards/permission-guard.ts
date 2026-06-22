import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '@dima-new/data-access-prisma';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RedisService } from '../infrastructure/storage/redis.service';
import { EmployeeGuard } from './employee-guard';

type RequestWithUser = {
  user?: {
    id?: string;
    type?: 'customer' | 'employee';
    role?: string;
  };
};

@Injectable()
export class PermissionGuard extends EmployeeGuard implements CanActivate {
  private readonly cacheTtlSeconds = 300;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const authenticated = await super.canActivate(context);
    if (!authenticated) {
      return false;
    }

    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) {
      return true;
    }

    const request =
      context.getType() === 'http'
        ? context.switchToHttp().getRequest<RequestWithUser>()
        : GqlExecutionContext.create(context).getContext<{
            req: RequestWithUser;
          }>().req;
    const user = request.user;
    if (!user?.id || user.type !== 'employee') {
      throw new ForbiddenException('Employee permission required');
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'SuperAdmin') {
      return true;
    }

    const permissions = await this.getCachedPermissionSlugs(user.id);
    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }
    return true;
  }

  private async getCachedPermissionSlugs(employeeId: string) {
    const cacheKey = this.permissionCacheKey(employeeId);
    const cached = await this.redisService.getJson<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: {
          deletedAt: null,
          OR: [
            { employees: { some: { id: employeeId } } },
            { employeeRoles: { some: { employeeId } } },
            {
              temporaryElevations: {
                some: {
                  employeeId,
                  revokedAt: null,
                  expiresAt: { gt: now },
                },
              },
            },
          ],
        },
      },
      select: { permission: { select: { slug: true } } },
    });
    const permissions = Array.from(
      new Set(rolePermissions.map((item) => item.permission.slug)),
    ).sort();
    await this.redisService.setJson(
      cacheKey,
      permissions,
      this.cacheTtlSeconds,
    );
    return permissions;
  }

  private permissionCacheKey(employeeId: string) {
    return `permissions:employee:${employeeId}`;
  }
}
