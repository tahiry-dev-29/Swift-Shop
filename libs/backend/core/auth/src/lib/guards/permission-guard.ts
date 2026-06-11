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

    const permissionCount = await this.prisma.rolePermission.count({
      where: {
        permission: { slug: requiredPermission },
        role: {
          OR: [
            { employees: { some: { id: user.id } } },
            { employeeRoles: { some: { employeeId: user.id } } },
          ],
          deletedAt: null,
        },
      },
    });
    if (permissionCount === 0) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }
    return true;
  }
}
