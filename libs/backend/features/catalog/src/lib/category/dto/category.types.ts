import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field()
  active!: boolean;

  @Field(() => Int)
  position!: number;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => [CategoryType], { nullable: true })
  children?: CategoryType[];

  @Field()
  slug!: string;

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

  @Field()
  path!: string;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@ObjectType()
export class CategoryEdge {
  @Field(() => CategoryType)
  node!: CategoryType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class CategoryPageInfo {
  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string;

  @Field(() => String, { nullable: true })
  endCursor?: string;
}

@ObjectType()
export class CategoryConnection {
  @Field(() => [CategoryEdge])
  edges!: CategoryEdge[];

  @Field(() => CategoryPageInfo)
  pageInfo!: CategoryPageInfo;

  @Field(() => Int)
  totalCount!: number;
}
