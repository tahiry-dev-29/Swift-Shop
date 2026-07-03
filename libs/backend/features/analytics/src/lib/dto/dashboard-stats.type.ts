import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardStatsType {
  @Field(() => Int)
  ordersCount!: number;

  @Field(() => Int)
  itemsSold!: number;

  @Field(() => Float)
  grossSales!: number;

  @Field(() => Float)
  netSales!: number;

  @Field(() => Float)
  taxTotal!: number;

  @Field(() => Float)
  averageOrder!: number;

  @Field(() => Int)
  productViews!: number;
}
