import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import {
  AuthService,
  CustomerGuard,
  EmployeeGuard,
} from '@swift-shop/backend/auth';
import { CustomerService } from './customer.service';
import { CustomerType, CustomerAuthResponse } from './dto';

@Resolver()
export class CustomerResolver {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
  ) {}

  @Query(() => CustomerType)
  @UseGuards(CustomerGuard)
  async customerMe(@Context() ctx: { req: { user: { id: string } } }) {
    const customer = await this.customerService.findById(ctx.req.user.id);
    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }
    return customer;
  }

  @Query(() => [CustomerType])
  @UseGuards(EmployeeGuard)
  async customers() {
    return this.customerService.findAll();
  }

  @Mutation(() => CustomerAuthResponse)
  async customerRefreshToken(@Args('token') token: string) {
    return this.authService.refreshToken(token);
  }

  @Mutation(() => Boolean)
  @UseGuards(CustomerGuard)
  async customerLogout(
    @Context()
    ctx: {
      req: { user: { id: string; jti?: string; exp?: number } };
    },
  ) {
    const user = ctx.req.user;
    await this.authService.logout(user.id, user.jti, user.exp);
    await this.authService.audit({
      action: 'customer.logout',
      actorType: 'customer',
      actorId: user.id,
      customerId: user.id,
    });
    return true;
  }
}
