import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AddressType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int, { nullable: true })
  customerId?: number;

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

  @Field()
  active!: boolean;

  @Field()
  deleted!: boolean;
}
