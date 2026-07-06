import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth-guard';

interface AuthUser {
  id: string;
  email: string;
  type: 'customer' | 'employee';
}

function isAuthUser(value: unknown): value is AuthUser {
  return typeof value === 'object' && value !== null && 'type' in value;
}

@Injectable()
export class EmployeeGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    void _info;
    void _context;
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    if (!isAuthUser(user) || user.type !== 'employee') {
      throw new UnauthorizedException('Employee access only');
    }
    return user;
  }
}
