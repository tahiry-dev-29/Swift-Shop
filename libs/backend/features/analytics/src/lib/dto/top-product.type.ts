import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TopProductType {
  @Field(() => ID)
  productId!: string;

  @Field()
  name!: string;

  @Field()
  reference!: string;

  @Field(() => Int)
  quantitySold!: number;

  @Field(() => Float)
  revenue!: number;

  @Field(() => Int)
  views!: number;
}
