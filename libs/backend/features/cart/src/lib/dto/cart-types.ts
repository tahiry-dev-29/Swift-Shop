import { ObjectType, Field, Int, ID, Float, InputType } from '@nestjs/graphql';
import { ProductType } from '@dima-new/backend/catalog';
import { ProductCombinationType } from '@dima-new/backend/catalog';
import { PriceDetailType } from '@dima-new/backend/pricing';

@ObjectType()
export class CartItemType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cartId!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => ID, { nullable: true })
  combinationId?: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => ProductType)
  product!: ProductType;

  @Field(() => ProductCombinationType, { nullable: true })
  combination?: ProductCombinationType;

  @Field(() => PriceDetailType, { nullable: true })
  priceDetail?: PriceDetailType;

  @Field(() => Float)
  lineTotal!: number; 

  @Field()
  dateAdd!: Date;
}

@ObjectType()
export class CartType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => String, { nullable: true })
  sessionId?: string;

  @Field(() => [CartItemType])
  items!: CartItemType[];

  @Field(() => Float)
  totalHT!: number;

  @Field(() => Float)
  totalTax!: number;

  @Field(() => Float)
  totalTTC!: number;

  @Field(() => Int)
  itemCount!: number;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@InputType()
export class AddToCartInput {
  @Field(() => ID)
  productId!: string;

  @Field(() => ID, { nullable: true })
  combinationId?: string;

  @Field(() => Int, { defaultValue: 1 })
  quantity!: number;
}
