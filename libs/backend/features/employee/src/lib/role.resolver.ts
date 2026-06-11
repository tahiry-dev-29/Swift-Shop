import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import {
  CurrentUser,
  EmployeeGuard,
  SuperAdminGuard,
} from '@dima-new/backend/auth';
import { AuthUser } from '@dima-new/models';
import { EmployeeRoleAssignmentService } from './employee-role-assignment.service';
import { RolePermissionService } from './role-permission.service';
import { RoleService } from './role.service';
import { EmployeeType, RoleType } from './dto/employee-types';
import { CreateRoleInput, UpdateRoleInput } from './dto/role-inputs';
import {
  PermissionType,
  PermissionsMatrixResourceType,
  RoleSummaryType,
  RoleListType,
} from './dto/permission-types';
import { PermissionIdsInput, RoleIdsInput } from './dto/permission-inputs';
import { RoleFilterInput } from './dto/role-inputs';

@Resolver(() => RoleType)
export class RoleResolver {
  constructor(
    private readonly roleService: RoleService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly employeeRoleService: EmployeeRoleAssignmentService,
  ) {}

  @Query(() => [RoleSummaryType])
  @UseGuards(SuperAdminGuard)
  async roles() {
    return this.roleService.findAll();
  }

  @Query(() => RoleListType)
  @UseGuards(SuperAdminGuard)
  async listRoles(
    @Args('filter', { nullable: true }) filter?: RoleFilterInput,
  ) {
    return this.roleService.listRoles(filter);
  }

  @Query(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async role(@Args('id', { type: () => ID }) id: string) {
    const role = await this.roleService.findById(id);
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  @Query(() => [PermissionsMatrixResourceType])
  @UseGuards(SuperAdminGuard)
  async permissionsMatrix() {
    return this.rolePermissionService.getPermissionsMatrix();
  }

  @Query(() => [PermissionType])
  @UseGuards(EmployeeGuard)
  async myPermissions(@CurrentUser() user: AuthUser) {
    return this.rolePermissionService.getEffectivePermissions(user.id);
  }

  @Mutation(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async createRole(@Args('input') input: CreateRoleInput) {
    return this.roleService.create(input);
  }

  @Mutation(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async updateRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoleInput,
  ) {
    return this.roleService.update(id, input);
  }

  @Mutation(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async deleteRole(@Args('id', { type: () => ID }) id: string) {
    return this.roleService.delete(id);
  }

  @Mutation(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async cloneRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('newName') newName: string,
  ) {
    return this.roleService.cloneRole(id, newName);
  }

  @Mutation(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async assignPermissionsToRole(
    @Args('roleId', { type: () => ID }) roleId: string,
    @Args('input') input: PermissionIdsInput,
  ) {
    return this.rolePermissionService.assignPermissionsToRole(
      roleId,
      input.permissionIds,
    );
  }

  @Mutation(() => RoleType)
  @UseGuards(SuperAdminGuard)
  async revokePermissionsFromRole(
    @Args('roleId', { type: () => ID }) roleId: string,
    @Args('input') input: PermissionIdsInput,
  ) {
    return this.rolePermissionService.revokePermissionsFromRole(
      roleId,
      input.permissionIds,
    );
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async assignRolesToEmployee(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input') input: RoleIdsInput,
  ) {
    return this.employeeRoleService.assignRolesToEmployee(
      employeeId,
      input.roleIds,
    );
  }

  @Mutation(() => EmployeeType)
  @UseGuards(SuperAdminGuard)
  async revokeRolesFromEmployee(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input') input: RoleIdsInput,
  ) {
    return this.employeeRoleService.revokeRolesFromEmployee(
      employeeId,
      input.roleIds,
    );
  }
}
