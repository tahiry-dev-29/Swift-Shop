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
