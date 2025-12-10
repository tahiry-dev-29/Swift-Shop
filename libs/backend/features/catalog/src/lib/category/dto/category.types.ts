import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
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
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

