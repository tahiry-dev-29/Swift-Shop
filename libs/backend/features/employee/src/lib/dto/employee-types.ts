import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';


@ObjectType()
export class RoleType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isSystem!: boolean;
}

@ObjectType()
export class EmployeeType {
  @Field(() => Int)
  id!: number;

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

  @Field(() => EmployeeType)
  employee!: EmployeeType;
}
