import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class RoleType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isSystem!: boolean;
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

  @Field({ nullable: true })
  lastConnectionDate?: Date;

  @Field()
  twoFactorEnabled!: boolean;

  @Field()
  forcePasswordReset!: boolean;
}

@ObjectType()
export class EmployeeAuthResponse {
  @Field({ nullable: true })
  accessToken?: string;

  @Field(() => EmployeeType, { nullable: true })
  employee?: EmployeeType;

  @Field({ nullable: true })
  requires2FA?: boolean;

  @Field({ nullable: true })
  requiresPasswordReset?: boolean;

  @Field({ nullable: true })
  passwordResetToken?: string;

  @Field({ nullable: true })
  trustedDeviceToken?: string;
}

@ObjectType()
export class TwoFactorGenerateResponse {
  @Field()
  secret!: string;

  @Field()
  qrCodeUrl!: string;
}
