import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthService, CustomerGuard, EmployeeGuard } from '@dima-new/backend/auth';
import { CustomerType, CustomerAuthResponse, CustomerRegisterInput } from './dto';

@Resolver()
export class CustomerResolver {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authService: AuthService
  ) {}

  @Mutation(() => CustomerAuthResponse)
  async customerLogin(
    @Args('email') email: string,
    @Args('password') password: string
  ) {
    const customer = await this.authService.validateCustomer(email, password);
    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.authService.generateCustomerToken(customer);
    return { ...token, customer };
  }

  @Mutation(() => CustomerAuthResponse)
  async customerRegister(@Args('input') input: CustomerRegisterInput) {
    const existing = await this.customerService.findByEmail(input.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const customer = await this.customerService.register(input);
    const token = this.authService.generateCustomerToken(customer);
    return { ...token, customer };
  }

  @Query(() => CustomerType)
  @UseGuards(CustomerGuard)
  async customerMe(@Context() ctx: { req: { user: { id: number } } }) {
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
}
