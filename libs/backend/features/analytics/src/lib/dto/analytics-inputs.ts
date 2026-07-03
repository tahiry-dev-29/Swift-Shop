import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class TrackProductViewInput {
  @Field(() => ID)
  productId!: string;

  customerId?: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  userAgent?: string;

  ipAddress?: string;
}
