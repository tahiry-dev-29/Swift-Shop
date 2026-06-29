import { Field, Float, ID, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field()
  provider!: string;

  @Field()
  status!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field({ nullable: true })
  externalId?: string;
}

@ObjectType()
export class RefundType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  paymentId!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  status!: string;

  @Field({ nullable: true })
  reason?: string;
}

@InputType()
export class InitiatePaymentInput {
  @Field(() => ID)
  orderId!: string;

  @Field()
  provider!: string;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field({ defaultValue: 'EUR' })
  currency!: string;

  @Field({ nullable: true })
  idempotencyKey?: string;
}

@InputType()
export class RefundPaymentInput {
  @Field(() => ID)
  paymentId!: string;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  reason?: string;
}

@InputType()
export class PaymentWebhookInput {
  @Field()
  provider!: string;

  @Field()
  eventId!: string;

  @Field()
  signature!: string;

  @Field()
  payload!: string;
}
