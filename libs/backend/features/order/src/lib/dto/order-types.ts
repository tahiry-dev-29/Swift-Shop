import { ObjectType, Field, ID, Float, Int, InputType } from '@nestjs/graphql';
import { CustomerType } from '@dima-new/backend/customer';

@ObjectType()
export class OrderStateType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  color!: string;

  @Field(() => Int)
  position!: number;
}

@ObjectType()
export class OrderAddressType {
  @Field(() => ID)
  id!: string;

  @Field()
  type!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field({ nullable: true })
  company?: string;

  @Field()
  address1!: string;

  @Field({ nullable: true })
  address2?: string;

  @Field()
  postcode!: string;

  @Field()
  city!: string;

  @Field()
  country!: string;

  @Field({ nullable: true })
  phone?: string;
}

@ObjectType()
export class OrderItemType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => ID, { nullable: true })
  combinationId?: string;

  @Field()
  productName!: string;

  @Field()
  productRef!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Float)
  unitPriceHT!: number;

  @Field(() => Float)
  taxRate!: number;

  @Field(() => Float)
  totalHT!: number;

  @Field(() => Float)
  totalTTC!: number;
}

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id!: string;

  @Field()
  reference!: string;

  @Field(() => ID)
  customerId!: string;

  @Field(() => CustomerType)
  customer!: CustomerType;

  @Field(() => OrderStateType)
  state!: OrderStateType;

  @Field(() => Float)
  totalHT!: number;

  @Field(() => Float)
  totalTax!: number;

  @Field(() => Float)
  totalTTC!: number;

  @Field(() => [OrderItemType])
  items!: OrderItemType[];

  @Field(() => [OrderAddressType])
  addresses!: OrderAddressType[];

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  cartId!: string;

  @Field(() => ID)
  deliveryAddressId!: string;

  @Field(() => ID, { nullable: true })
  billingAddressId?: string;
}
