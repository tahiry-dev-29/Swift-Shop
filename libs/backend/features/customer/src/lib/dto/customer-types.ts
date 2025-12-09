import { ObjectType, Field, Int } from '@nestjs/graphql';
import { CustomerGroupType } from '@dima-new/backend/customer-group';

@ObjectType()
export class CustomerType {
  @Field(() => Int)
  id!: number;

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
