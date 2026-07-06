import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { RedisService } from '../infrastructure/storage/redis.service';
import { EmployeeGuard } from './employee-guard';

type RequestUser = { id?: string; type?: string };
type RequestWithUser = { user?: RequestUser };

function hasUserId(user: unknown): user is RequestUser {
  return typeof user === 'object' && user !== null && 'id' in user;
}

@Injectable()
export class SuperAdminGuard extends EmployeeGuard {
  private readonly cacheTtl = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = this.getRequest(context) as RequestWithUser;
    const user = request.user;
    if (!hasUserId(user) || !user.id) {
      throw new ForbiddenException('Super Admin access required');
    }
    return this.verifySuperAdmin(user.id);
  }

  private async verifySuperAdmin(employeeId: string): Promise<boolean> {
    const cacheKey = `superadmin-check:${employeeId}`;
    const cached = await this.redisService.getJson<boolean>(cacheKey);
    if (cached !== null) {
      if (!cached) throw new ForbiddenException('Super Admin access required');
      return true;
    }

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

    const isSuperAdmin = found !== null;
    await this.redisService.setJson(cacheKey, isSuperAdmin, this.cacheTtl);
    if (!isSuperAdmin)
      throw new ForbiddenException('Super Admin access required');
    return true;
  }
}
