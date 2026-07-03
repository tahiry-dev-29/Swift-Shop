import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  employeeId?: string;

  @Field()
  type!: string;

  @Field()
  channel!: string;

  @Field()
  title!: string;

  @Field()
  body!: string;

  @Field({ nullable: true })
  data?: string;

  @Field({ nullable: true })
  readAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  failedAt?: Date;

  @Field({ nullable: true })
  failureReason?: string;

  @Field()
  dateAdd!: Date;
}

@ObjectType()
export class NotificationPreferenceType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  employeeId?: string;

  @Field()
  type!: string;

  @Field()
  channel!: string;

  @Field()
  enabled!: boolean;
}

@ObjectType()
export class PushSubscriptionType {
  @Field(() => ID)
  id!: string;

  @Field()
  endpoint!: string;

  @Field({ nullable: true })
  platform?: string;

  @Field()
  provider!: string;

  @Field()
  active!: boolean;
}

@ObjectType()
export class UnreadNotificationCountType {
  @Field(() => Int)
  count!: number;
}
