import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class FeatureValueType {
  @Field(() => ID)
  id: string;

  @Field()
  featureId: string;

  @Field()
  value: string;

  @Field(() => Int)
  position: number;

  @Field()
  custom: boolean;
}

@ObjectType()
export class FeatureType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  publicName: string;

  @Field(() => Int)
  position: number;

  @Field(() => [FeatureValueType], { nullable: true })
  values?: FeatureValueType[];
}
