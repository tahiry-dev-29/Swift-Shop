import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AuthService, EmployeeGuard, SuperAdminGuard } from '@dima-new/backend/auth';
import { EmployeeType, EmployeeAuthResponse, CreateEmployeeInput, UpdateEmployeeInput } from './dto';

@Resolver()
export class EmployeeResolver {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly authService: AuthService
  ) {}

  @Mutation(() => EmployeeAuthResponse)
  async employeeLogin(
    @Args('email') email: string,
    @Args('password') password: string
  ) {
    const employee = await this.authService.validateEmployee(email, password);
    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.authService.generateEmployeeToken(employee);
    return { ...token, employee };
  }

  @Query(() => EmployeeType)
  @UseGuards(EmployeeGuard)
  async employeeMe(@Context() ctx: { req: { user: { id: string } } }) {
    const employee = await this.employeeService.findById(ctx.req.user.id);
    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }
    return employee;
  }

  @Query(() => [EmployeeType])
  @UseGuards(SuperAdminGuard)
  async employees() {
    return this.employeeService.findAll();
  }

  @Query(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async employee(@Args('id', { type: () => ID }) id: string) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return employee;
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async createEmployee(@Args('input') input: CreateEmployeeInput) {
    const existing = await this.employeeService.findByEmail(input.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }
    return this.employeeService.create(input);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async updateEmployee(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmployeeInput
  ) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return this.employeeService.update(id, input);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async deleteEmployee(@Args('id', { type: () => ID }) id: string) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return this.employeeService.delete(id);
  }

  @Mutation(() => EmployeeAuthResponse)
  async employeeRefreshToken(@Args('token') token: string) {
    const result = await this.authService.refreshToken(token);
    return result;
  }

  @Mutation(() => Boolean)
  @UseGuards(EmployeeGuard)
  async employeeLogout(@Context() ctx: { req: { user: { id: string, jti?: string, exp?: number } } }) {
    const user = ctx.req.user;
    await this.authService.logout(user.id, user.jti, user.exp);
    return true;
  }
}

