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

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  metaTitle?: string;

  @Field({ nullable: true })
  metaDescription?: string;

  @Field({ nullable: true })
  metaKeywords?: string;

  @Field({ nullable: true })
  banner?: string;

  @Field({ nullable: true })
  thumbnail?: string;
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

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  metaTitle?: string;

  @Field({ nullable: true })
  metaDescription?: string;

  @Field({ nullable: true })
  metaKeywords?: string;

  @Field({ nullable: true })
  banner?: string;

  @Field({ nullable: true })
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

  @Field({ nullable: true })
  after?: string;

  @Field(() => ID, { nullable: true })
  parentId?: string;
}
