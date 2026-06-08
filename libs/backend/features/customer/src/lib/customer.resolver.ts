import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthService, CustomerGuard, EmployeeGuard } from '@dima-new/backend/auth';
import { CustomerType, CustomerAuthResponse, CustomerRegisterInput } from './dto';
import { CartService } from '@dima-new/backend/cart';

interface GraphQLContext {
  req: {
    headers: Record<string, string | string[] | undefined>;
  };
}

@Resolver()
export class CustomerResolver {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
    private readonly cartService: CartService
  ) {}

  @Mutation(() => CustomerAuthResponse)
  async customerLogin(
    @Context() context: GraphQLContext,
    @Args('email') email: string,
    @Args('password') password: string
  ) {
    const customer = await this.authService.validateCustomer(email, password);
    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.authService.generateCustomerToken(customer);

    const sessionId = context.req?.headers?.['x-session-id'];
    if (sessionId) {
        await this.cartService.mergeGuestCart(
          Array.isArray(sessionId) ? sessionId[0] : sessionId,
          customer.id
        );
    }

    return { ...token, customer };
  }

  @Mutation(() => CustomerAuthResponse)
  async customerRegister(@Args('input') input: CustomerRegisterInput) {
    const existing = await this.customerService.findByEmail(input.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const customer = await this.customerService.register(input);
    const token = await this.authService.generateCustomerToken(customer);
    return { ...token, customer };
  }

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
    const result = await this.authService.refreshToken(token);
    return result;
  }

  @Mutation(() => Boolean)
  @UseGuards(CustomerGuard)
  async customerLogout(@Context() ctx: { req: { user: { id: string, jti?: string, exp?: number } } }) {
    const user = ctx.req.user;
    await this.authService.logout(user.id, user.jti, user.exp);
    return true;
  }
}

