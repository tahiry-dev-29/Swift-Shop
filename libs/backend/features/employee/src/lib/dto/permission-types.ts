import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PermissionType {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  resource!: string;

  @Field()
  action!: string;

  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
export class PermissionsMatrixCellType {
  @Field()
  resource!: string;

  @Field()
  action!: string;

  @Field(() => PermissionType, { nullable: true })
  permission?: PermissionType;
}

@ObjectType()
export class PermissionsMatrixResourceType {
  @Field()
  resource!: string;

  @Field(() => [PermissionsMatrixCellType])
  permissions!: PermissionsMatrixCellType[];
}

@ObjectType()
export class RoleSummaryType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isSystem!: boolean;

  @Field(() => Int)
  permissionCount!: number;

  @Field(() => Int)
  employeeCount!: number;
}

@ObjectType()
export class RoleListType {
  @Field(() => [RoleSummaryType])
  items!: RoleSummaryType[];

  @Field(() => Int)
  total!: number;
}
