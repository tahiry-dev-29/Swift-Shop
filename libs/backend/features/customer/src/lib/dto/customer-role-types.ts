import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CustomerRoleType {
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

  @Field(() => [String])
  permissions!: string[];

  @Field()
  dateAdd!: Date;

  @Field(() => Int, { nullable: true })
  customerCount?: number;
}

@ObjectType()
export class CustomerRoleListType {
  @Field(() => [CustomerRoleType])
  items!: CustomerRoleType[];

  @Field(() => Int)
  total!: number;
}
