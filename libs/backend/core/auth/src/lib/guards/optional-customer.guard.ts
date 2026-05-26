import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth-guard';

@Injectable()
export class OptionalCustomerGuard extends JwtAuthGuard {
  override handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
