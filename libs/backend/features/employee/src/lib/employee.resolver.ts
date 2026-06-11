import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import {
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeGuard, SuperAdminGuard } from '@dima-new/backend/auth';
import { EmployeeService } from './employee.service';
import { EmployeeType, CreateEmployeeInput, UpdateEmployeeInput } from './dto';

@Resolver()
export class EmployeeResolver {
  constructor(private readonly employeeService: EmployeeService) {}

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
    @Args('input') input: UpdateEmployeeInput,
  ) {
    await this.assertEmployeeExists(id);
    return this.employeeService.update(id, input);
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async deleteEmployee(@Args('id', { type: () => ID }) id: string) {
    await this.assertEmployeeExists(id);
    return this.employeeService.delete(id);
  }

  private async assertEmployeeExists(id: string) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
  }
}
