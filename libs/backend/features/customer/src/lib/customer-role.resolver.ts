import { UseGuards, NotFoundException } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { SuperAdminGuard } from '@swift-shop/backend/auth';
import { CustomerRoleService } from './customer-role.service';
import {
  CreateCustomerRoleInput,
  UpdateCustomerRoleInput,
} from './dto/customer-role-inputs';
import { CustomerRoleType } from './dto/customer-role-types';

@Resolver(() => CustomerRoleType)
export class CustomerRoleResolver {
  constructor(private readonly customerRoleService: CustomerRoleService) {}

  @Query(() => [CustomerRoleType])
  @UseGuards(SuperAdminGuard)
  async customerRoles() {
    return this.customerRoleService.findAll();
  }

  @Query(() => CustomerRoleType)
  @UseGuards(SuperAdminGuard)
  async customerRole(@Args('id', { type: () => ID }) id: string) {
    const role = await this.customerRoleService.findById(id);
    if (!role) {
      throw new NotFoundException(`Customer role #${id} not found`);
    }
    return role;
  }

  @Mutation(() => CustomerRoleType)
  @UseGuards(SuperAdminGuard)
  async createCustomerRole(@Args('input') input: CreateCustomerRoleInput) {
    return this.customerRoleService.create(input);
  }

  @Mutation(() => CustomerRoleType)
  @UseGuards(SuperAdminGuard)
  async updateCustomerRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerRoleInput,
  ) {
    return this.customerRoleService.update(id, input);
  }

  @Mutation(() => CustomerRoleType)
  @UseGuards(SuperAdminGuard)
  async deleteCustomerRole(@Args('id', { type: () => ID }) id: string) {
    return this.customerRoleService.delete(id);
  }

  @Mutation(() => CustomerRoleType)
  @UseGuards(SuperAdminGuard)
  async assignCustomerRoleToCustomer(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('customerRoleId', { type: () => ID }) customerRoleId: string,
  ) {
    const role = await this.customerRoleService.assignRoleToCustomer(
      customerId,
      customerRoleId,
    );
    if (!role) {
      throw new NotFoundException(`Customer role #${customerRoleId} not found`);
    }
    return role;
  }

  @Mutation(() => CustomerRoleType)
  @UseGuards(SuperAdminGuard)
  async revokeCustomerRoleFromCustomer(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('customerRoleId', { type: () => ID }) customerRoleId: string,
  ) {
    const role = await this.customerRoleService.revokeRoleFromCustomer(
      customerId,
      customerRoleId,
    );
    if (!role) {
      throw new NotFoundException(`Customer role #${customerRoleId} not found`);
    }
    return role;
  }
}
