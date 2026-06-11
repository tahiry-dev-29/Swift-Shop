import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class AddressType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

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

  @Field(() => ID)
  countryId!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  phoneMobile?: string;

  @Field({ nullable: true })
  vatNumber?: string;

  @Field()
  active!: boolean;

  @Field()
  deleted!: boolean;
}
