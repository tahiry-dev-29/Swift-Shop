import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AttributeValueType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  attributeGroupId!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => Int)
  position!: number;
}

@ObjectType()
export class AttributeGroupType {
  @Field(() => Int)
  id!: number;

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
