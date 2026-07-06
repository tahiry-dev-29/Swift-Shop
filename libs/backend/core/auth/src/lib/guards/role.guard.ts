import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { REQUIRED_ROLE_KEY } from '../decorators/require-role.decorator';
import { RedisService } from '../infrastructure/storage/redis.service';
import { JwtAuthGuard } from './jwt-auth-guard';

type RequestUser = {
  id?: string;
  type?: 'customer' | 'employee';
  role?: string;
};

type RequestWithUser = { user?: RequestUser };

function isRequestUser(value: unknown): value is RequestUser {
  return typeof value === 'object' && value !== null && 'type' in value;
}

@Injectable()
export class RoleGuard extends JwtAuthGuard implements CanActivate {
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

    const requiredSlugs = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredSlugs || requiredSlugs.length === 0) return true;

    const request = this.extractRequest(context);
    const user = request.user;
    if (!isRequestUser(user) || !user.id || !user.type) {
      throw new UnauthorizedException('Authentication required');
    }

    const hasRole =
      user.type === 'employee'
        ? await this.checkEmployeeRoles(user.id, requiredSlugs)
        : await this.checkCustomerRoles(user.id, requiredSlugs);

    if (!hasRole) {
      throw new ForbiddenException(
        `Required role(s): ${requiredSlugs.join(', ')}`,
      );
    }
    return true;
  }

  private async checkEmployeeRoles(
    employeeId: string,
    requiredSlugs: string[],
  ): Promise<boolean> {
    const cacheKey = `role-slugs:employee:${employeeId}`;
    const cached = await this.redisService.getJson<string[]>(cacheKey);
    const slugs = cached ?? (await this.fetchEmployeeRoleSlugs(employeeId));
    if (!cached) {
      await this.redisService.setJson(cacheKey, slugs, this.cacheTtl);
    }
    if (slugs.includes('super_admin')) return true;
    return requiredSlugs.some((s) => slugs.includes(s));
  }

  private async fetchEmployeeRoleSlugs(employeeId: string): Promise<string[]> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        role: { select: { slug: true } },
        roles: { include: { role: { select: { slug: true } } } },
      },
    });
    if (!employee) return [];
    const slugSet = new Set<string>([employee.role.slug]);
    for (const er of employee.roles) slugSet.add(er.role.slug);
    return Array.from(slugSet);
  }

  private async checkCustomerRoles(
    customerId: string,
    requiredSlugs: string[],
  ): Promise<boolean> {
    const cacheKey = `role-slugs:customer:${customerId}`;
    const cached = await this.redisService.getJson<string[]>(cacheKey);
    const slugs = cached ?? (await this.fetchCustomerRoleSlugs(customerId));
    if (!cached) {
      await this.redisService.setJson(cacheKey, slugs, this.cacheTtl);
    }
    return requiredSlugs.some((s) => slugs.includes(s));
  }

  private async fetchCustomerRoleSlugs(customerId: string): Promise<string[]> {
    const assignments = await this.prisma.customerRoleAssignment.findMany({
      where: { customerId, customerRole: { deletedAt: null } },
      include: { customerRole: { select: { slug: true } } },
    });
    return assignments.map((a) => a.customerRole.slug);
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
