import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth-guard';

interface AuthUser {
  id: string;
  email: string;
  type: 'customer' | 'employee';
}

@Injectable()
export class CustomerGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(err: unknown, user: TUser, _info: unknown, _context: ExecutionContext): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    if ((user as AuthUser).type !== 'customer') {
      throw new UnauthorizedException('Customer access only');
    }
    return user;
  }
}

