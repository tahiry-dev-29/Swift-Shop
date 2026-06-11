import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateRoleInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class UpdateRoleInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class RoleFilterInput {
  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  isSystem?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  take?: number;
}
