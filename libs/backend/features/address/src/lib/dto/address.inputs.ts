import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateAddressInput {
  @Field()
  alias!: string;

  @Field({ nullable: true })
  company?: string;

  @Field()
  lastname!: string;

  @Field()
  firstname!: string;

  @Field()
  address1!: string;

  @Field({ nullable: true })
  address2?: string;

  @Field()
  postcode!: string;

  @Field()
  city!: string;

  @Field(() => Int)
  countryId!: number;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  phoneMobile?: string;

  @Field({ nullable: true })
  vatNumber?: string;
}

@InputType()
export class UpdateAddressInput {
  @Field({ nullable: true })
  alias?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true })
  lastname?: string;

  @Field({ nullable: true })
  firstname?: string;

  @Field({ nullable: true })
  address1?: string;

  @Field({ nullable: true })
  address2?: string;

  @Field({ nullable: true })
  postcode?: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => Int, { nullable: true })
  countryId?: number;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  phoneMobile?: string;

  @Field({ nullable: true })
  vatNumber?: string;

  @Field({ nullable: true })
  active?: boolean;
}
