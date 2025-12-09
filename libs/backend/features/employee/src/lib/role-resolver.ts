import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { SuperAdminGuard } from '@dima-new/backend/auth';
import { RoleService } from './role-service';
import { RoleType } from './dto/employee-types';
import { CreateRoleInput, UpdateRoleInput } from './dto/role-inputs';

@Resolver(() => RoleType)
@UseGuards(SuperAdminGuard) 
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Query(() => [RoleType])
  async roles() {
    return this.roleService.findAll();
  }

  @Query(() => RoleType)
  async role(@Args('id', { type: () => Int }) id: number) {
    const role = await this.roleService.findById(id);
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  @Mutation(() => RoleType)
  async createRole(@Args('input') input: CreateRoleInput) {
    try {
      return await this.roleService.create(input);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Mutation(() => RoleType)
  async updateRole(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateRoleInput
  ) {
    try {
      return await this.roleService.update(id, input);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Mutation(() => RoleType)
  async deleteRole(@Args('id', { type: () => Int }) id: number) {
    try {
      return await this.roleService.delete(id);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
