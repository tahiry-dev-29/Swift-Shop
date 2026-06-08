import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { EmployeeGuard } from './employee-guard';

interface AuthUser {
  id: string;
  email: string;
  type: 'customer' | 'employee';
  role?: string;
}

@Injectable()
export class SuperAdminGuard extends EmployeeGuard {
  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const validUser = super.handleRequest(err, user, info, context);
    if ((validUser as AuthUser).role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Super Admin access required');
    }
    return validUser;
  }
}
