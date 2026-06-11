import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class AttributeValueType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  attributeGroupId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => Int)
  position!: number;
}

@ObjectType()
export class AttributeGroupType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  publicName!: string;

  @Field(() => Int)
  position!: number;

  @Field()
  type!: string;

  @Field(() => [AttributeValueType], { nullable: true })
  values?: AttributeValueType[];
}
