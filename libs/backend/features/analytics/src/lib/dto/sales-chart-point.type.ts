import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SalesChartPointType {
  @Field()
  date!: Date;

  @Field(() => Int)
  ordersCount!: number;

  @Field(() => Int)
  itemsSold!: number;

  @Field(() => Float)
  grossSales!: number;

  @Field(() => Float)
  netSales!: number;
}
