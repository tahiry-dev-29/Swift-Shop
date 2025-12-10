import { InputType, Field, Int, ID } from '@nestjs/graphql';

@InputType()
export class CreateCategoryInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: true })
  active!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  position!: number;

  @Field(() => ID, { nullable: true })
  parentId?: string;
}

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  active?: boolean;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field(() => ID, { nullable: true })
  parentId?: string;
}
