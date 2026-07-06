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

@Injectable()
export class CustomerGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    const isAuthUser = (user: unknown): user is AuthUser => {
      return typeof user === 'object' && user !== null && 'type' in user;
    };

    if (!isAuthUser(user) || user.type !== 'customer') {
      throw new UnauthorizedException('Customer access only');
    }
    return user;
  }
}
