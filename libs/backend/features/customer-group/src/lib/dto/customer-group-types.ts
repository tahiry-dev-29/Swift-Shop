import { ObjectType, InputType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class CustomerGroupType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  reduction!: number;

  @Field()
  showPrices!: boolean;
}

@InputType()
export class CreateCustomerGroupInput {
  @Field()
  name!: string;

  @Field({ defaultValue: 0 })
  reduction!: number;

  @Field({ defaultValue: true })
  showPrices!: boolean;
}

@InputType()
export class UpdateCustomerGroupInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  reduction?: number;

  @Field({ nullable: true })
  showPrices?: boolean;
}

