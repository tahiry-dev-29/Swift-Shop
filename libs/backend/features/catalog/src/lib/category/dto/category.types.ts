import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  active!: boolean;

  @Field(() => Int)
  position!: number;

  @Field(() => Int, { nullable: true })
  parentId?: number;

  @Field(() => [CategoryType], { nullable: true })
  children?: CategoryType[];

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}
