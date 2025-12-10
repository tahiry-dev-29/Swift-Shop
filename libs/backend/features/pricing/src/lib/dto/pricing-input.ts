import { InputType, Field, Int, Float, ID } from '@nestjs/graphql';

@InputType()
export class CreateSpecificPriceInput {
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

  @Field(() => Int, { defaultValue: 1 })
  fromQuantity!: number;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;

  @Field(() => Int, { defaultValue: 1 })
  priority!: number;

  @Field({ defaultValue: true })
  active!: boolean;
}

@InputType()
export class UpdateSpecificPriceInput {
  @Field({ nullable: true })
  reductionType?: string;

  @Field(() => Float, { nullable: true })
  reduction?: number;

  @Field(() => Int, { nullable: true })
  fromQuantity?: number;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;

  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field({ nullable: true })
  active?: boolean;
}

@InputType()
export class CreateCountryInput {
  @Field()
  isoCode!: string;

  @Field()
  name!: string;

  @Field(() => Float, { defaultValue: 20.0 })
  taxRate!: number;

  @Field({ defaultValue: true })
  active!: boolean;
}

@InputType()
export class UpdateCountryInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  taxRate?: number;

  @Field({ nullable: true })
  active?: boolean;
}
