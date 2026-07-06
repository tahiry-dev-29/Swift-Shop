import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCustomerRoleInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  permissions?: string[];
}

@InputType()
export class UpdateCustomerRoleInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  permissions?: string[];
}
