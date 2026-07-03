import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class TrackProductViewInput {
  @Field(() => ID)
  productId!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  ipAddress?: string;
}
