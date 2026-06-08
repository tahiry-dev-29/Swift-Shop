import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CustomerGroupType } from '@dima-new/backend/customer-group';

@ObjectType()
export class CustomerType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field({ nullable: true })
  company?: string;

  @Field()
  active!: boolean;

  @Field({ nullable: true })
  birthday?: Date;

  @Field(() => CustomerGroupType, { nullable: true })
  group?: CustomerGroupType;
}

@ObjectType()
export class CustomerAuthResponse {
  @Field()
  accessToken!: string;

  @Field(() => CustomerType)
  customer!: CustomerType;
}

@ObjectType()
export class MagicLinkResponse {
  @Field()
  sent!: boolean;

  @Field({ nullable: true })
  magicLink?: string;
}

@ObjectType()
export class OAuthAuthorizationResponse {
  @Field()
  authorizationUrl!: string;
}
