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
}

@ObjectType()
export class EmployeeAuthResponse {
  @Field()
  accessToken!: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field(() => EmployeeType)
  employee!: EmployeeType;
}

