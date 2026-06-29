import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CarrierType {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field()
  adapter!: string;

  @Field()
  active!: boolean;
}

@ObjectType()
export class ShippingRateQuoteType {
  @Field(() => ID)
  carrierId!: string;

  @Field()
  carrierCode!: string;

  @Field()
  carrierName!: string;

  @Field(() => Float)
  price!: number;

  @Field()
  currency!: string;
}

@InputType()
export class ShippingQuoteInput {
  @Field()
  countryIsoCode!: string;

  @Field(() => Int)
  weightGrams!: number;
}

@ObjectType()
export class ShipmentEventType {
  @Field(() => ID)
  id!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  location?: string;

  @Field()
  occurredAt!: Date;
}

@ObjectType()
export class ShipmentType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => ID, { nullable: true })
  carrierId?: string;

  @Field({ nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  carrier?: string;

  @Field()
  status!: string;

  @Field(() => [ShipmentEventType])
  events!: ShipmentEventType[];
}

@InputType()
export class CreateShipmentInput {
  @Field(() => ID)
  orderId!: string;

  @Field(() => ID, { nullable: true })
  carrierId?: string;

  @Field({ nullable: true })
  trackingNumber?: string;
}
