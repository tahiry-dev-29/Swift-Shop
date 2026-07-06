import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PermissionType } from './permission-types';

@ObjectType()
export class RoleType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  isSystem!: boolean;

  @Field()
  dateAdd!: Date;

  @Field(() => [PermissionType], { nullable: true })
  permissions?: PermissionType[];
}

@ObjectType()
export class EmployeeType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field()
  active!: boolean;

  @Field(() => RoleType)
  role!: RoleType;

  @Field(() => [RoleType], { nullable: true })
  roles?: RoleType[];

  @Field(() => Date, { nullable: true })
  lastConnectionDate?: Date | null;

  @Field()
  twoFactorEnabled!: boolean;

  @Field()
  forcePasswordReset!: boolean;
}

@ObjectType()
export class EmployeeAuthResponse {
  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => EmployeeType, { nullable: true })
  employee?: EmployeeType;

  @Field(() => Boolean, { nullable: true })
  requires2FA?: boolean;

  @Field(() => Boolean, { nullable: true })
  requiresPasswordReset?: boolean;

  @Field(() => String, { nullable: true })
  refreshToken?: string;
}

@ObjectType()
export class TwoFactorGenerateResponse {
  @Field()
  secret!: string;

  @Field()
  qrCodeUrl!: string;
}
