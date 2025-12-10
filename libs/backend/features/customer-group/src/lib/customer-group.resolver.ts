import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards, NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeGuard } from '@dima-new/backend/auth';
import { CustomerGroupService } from './customer-group.service';
import {
  CustomerGroupType,
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
} from './dto';

@Resolver()
@UseGuards(EmployeeGuard) 
export class CustomerGroupResolver {
  constructor(private readonly service: CustomerGroupService) {}

  @Query(() => [CustomerGroupType])
  async customerGroups() {
    return this.service.findAll();
  }

  @Query(() => CustomerGroupType)
  async customerGroup(@Args('id', { type: () => ID }) id: string) {
    const group = await this.service.findById(id);
    if (!group) {
      throw new NotFoundException(`CustomerGroup #${id} not found`);
    }
    return group;
  }

  @Mutation(() => CustomerGroupType)
  async createCustomerGroup(@Args('input') input: CreateCustomerGroupInput) {
    const existing = await this.service.findByName(input.name);
    if (existing) {
      throw new ConflictException('Customer Group name already exists');
    }
    return this.service.create(input);
  }

  @Mutation(() => CustomerGroupType)
  async updateCustomerGroup(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerGroupInput
  ) {
    return this.service.update(id, input);
  }

  @Mutation(() => CustomerGroupType)
  async deleteCustomerGroup(@Args('id', { type: () => ID }) id: string) {
    return this.service.delete(id);
  }
}

