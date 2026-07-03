import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductViewEventType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field({ nullable: true })
  source?: string;

  @Field()
  dateAdd!: Date;
}
