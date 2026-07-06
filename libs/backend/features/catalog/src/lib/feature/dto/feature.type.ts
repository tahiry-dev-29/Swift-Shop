import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class FeatureValueType {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare featureId: string;

  @Field()
  declare value: string;

  @Field(() => Int)
  declare position: number;

  @Field()
  declare custom: boolean;
}

@ObjectType()
export class FeatureType {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare name: string;

  @Field()
  declare publicName: string;

  @Field(() => Int)
  declare position: number;

  @Field(() => [FeatureValueType], { nullable: true })
  declare values?: FeatureValueType[];
}
