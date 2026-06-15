import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class PermissionIdsInput {
  @Field(() => [ID])
  permissionIds!: string[];
}

@InputType()
export class RoleIdsInput {
  @Field(() => [ID])
  roleIds!: string[];
}

@InputType()
export class BranchIdsInput {
  @Field(() => [ID])
  branchIds!: string[];
}

@InputType()
export class TemporaryRoleElevationInput {
  @Field(() => ID)
  roleId!: string;

  @Field()
  expiresAt!: Date;

  @Field({ nullable: true })
  reason?: string;
}
