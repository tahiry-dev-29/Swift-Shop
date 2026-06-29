import { ObjectType, Field, Float, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class PriceDetailType {
  @Field(() => Float)
  basePrice!: number;

  @Field(() => Float)
  combinationImpact!: number;

  @Field(() => Float)
  customerGroupReduction!: number;

  @Field(() => Float)
  specificPriceReduction!: number;

  @Field(() => Float)
  cartRuleReduction!: number;

  @Field(() => Float)
  priceHT!: number;

  @Field(() => Float)
  taxRate!: number;

  @Field(() => Float)
  taxAmount!: number;

  @Field(() => Float)
  priceTTC!: number;

  @Field({ nullable: true })
  currencyCode?: string;

  @Field(() => Int, { defaultValue: 0 })
  loyaltyPointsEarned?: number;
}

@ObjectType()
export class CountryType {
  @Field(() => ID)
  id!: string;

  @Field()
  isoCode!: string;

  @Field()
  name!: string;

  @Field()
  active!: boolean;

  @Field(() => Float)
  taxRate!: number;
}

@ObjectType()
export class TaxRuleType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => ID)
  countryId!: string;

  @Field(() => Float)
  rate!: number;

  @Field()
  active!: boolean;

  @Field(() => CountryType)
  country!: CountryType;
}

@ObjectType()
export class SpecificPriceType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  productId?: string;

  @Field(() => ID, { nullable: true })
  combinationId?: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  customerGroupId?: string;

  @Field(() => ID, { nullable: true })
  countryId?: string;

  @Field()
  reductionType!: string;

  @Field(() => Float)
  reduction!: number;

  @Field(() => Int)
  fromQuantity!: number;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;

  @Field(() => Int)
  priority!: number;

  @Field()
  active!: boolean;

  @Field({ defaultValue: false })
  isFlashSale!: boolean;

  @Field()
  dateAdd!: Date;
}
