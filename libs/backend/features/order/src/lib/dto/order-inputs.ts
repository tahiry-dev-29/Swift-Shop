import { Field, ID, InputType, Int } from '@nestjs/graphql';

/**
 * Input payload used to convert a customer cart into an order.
 */
@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  cartId!: string;

  @Field(() => ID)
  deliveryAddressId!: string;

  @Field(() => [ID], { nullable: true })
  deliveryAddressIds?: string[];

  @Field(() => ID, { nullable: true })
  billingAddressId?: string;

  @Field({ nullable: true })
  idempotencyKey?: string;
}

/**
 * Input payload used to create an order from a guest cart.
 */
@InputType()
export class GuestCheckoutInput extends CreateOrderInput {
  @Field()
  email!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field({ nullable: true })
  sessionId?: string;
}

/**
 * Input payload describing one order item requested for return.
 */
@InputType()
export class RequestReturnInputItem {
  @Field(() => ID)
  orderItemId!: string;

  @Field(() => Int)
  quantity!: number;

  @Field({ nullable: true })
  reason?: string;
}

/**
 * Input payload used by customers to request an order return.
 */
@InputType()
export class RequestReturnInput {
  @Field(() => ID)
  orderId!: string;

  @Field(() => [RequestReturnInputItem])
  items!: RequestReturnInputItem[];

  @Field({ nullable: true })
  customerNotes?: string;
}
