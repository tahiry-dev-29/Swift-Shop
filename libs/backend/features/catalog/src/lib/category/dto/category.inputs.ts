import { InputType, Field, Int, ID } from '@nestjs/graphql';

@InputType()
export class CreateCategoryInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field({ defaultValue: true })
  active!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  position!: number;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => String, { nullable: true })
  metaTitle?: string;

  @Field(() => String, { nullable: true })
  metaDescription?: string;

  @Field(() => String, { nullable: true })
  metaKeywords?: string;

  @Field(() => String, { nullable: true })
  banner?: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;
}

@InputType()
export class UpdateCategoryInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field({ nullable: true })
  active?: boolean;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => String, { nullable: true })
  metaTitle?: string;

  @Field(() => String, { nullable: true })
  metaDescription?: string;

  @Field(() => String, { nullable: true })
  metaKeywords?: string;

  @Field(() => String, { nullable: true })
  banner?: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;
}

@InputType()
export class UpdateCategoryPositionInput {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  position!: number;
}

@InputType()
export class CategoryConnectionArgs {
  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string;

  @Field(() => ID, { nullable: true })
  parentId?: string;
}
