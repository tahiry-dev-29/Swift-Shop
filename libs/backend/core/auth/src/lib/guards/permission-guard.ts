import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RedisService } from '../infrastructure/storage/redis.service';
import { EmployeeGuard } from './employee-guard';

type RequestUser = { id?: string; type?: 'customer' | 'employee' };
type RequestWithUser = { user?: RequestUser };

function isRequestUser(value: unknown): value is RequestUser {
  return typeof value === 'object' && value !== null && 'type' in value;
}

@Injectable()
export class PermissionGuard extends EmployeeGuard implements CanActivate {
  private readonly cacheTtl = 300;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) return false;

    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) return true;

    const request = this.extractRequest(context);
    const user = request.user;
    if (!isRequestUser(user) || !user.id || user.type !== 'employee') {
      throw new ForbiddenException('Employee permission required');
    }

    if (await this.isSuperAdmin(user.id)) return true;

    const permissions = await this.getCachedPermissionSlugs(user.id);
    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }
    return true;
  }

  private async isSuperAdmin(employeeId: string): Promise<boolean> {
    const cacheKey = `superadmin-check:${employeeId}`;
    const cached = await this.redisService.getJson<boolean>(cacheKey);
    if (cached !== null) return cached;

    const found = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        OR: [
          { role: { slug: 'super_admin' } },
          { roles: { some: { role: { slug: 'super_admin' } } } },
        ],
      },
      select: { id: true },
    });
    const result = found !== null;
    await this.redisService.setJson(cacheKey, result, this.cacheTtl);
    return result;
  }

  private async getCachedPermissionSlugs(
    employeeId: string,
  ): Promise<string[]> {
    const cacheKey = `permissions:employee:${employeeId}`;
    const cached = await this.redisService.getJson<string[]>(cacheKey);
    if (cached) return cached;

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
                some: { employeeId, revokedAt: null, expiresAt: { gt: now } },
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
    await this.redisService.setJson(cacheKey, permissions, this.cacheTtl);
    return permissions;
  }

  private extractRequest(context: ExecutionContext): RequestWithUser {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<RequestWithUser>();
    }
    return GqlExecutionContext.create(context).getContext<{
      req: RequestWithUser;
    }>().req;
  }
}
