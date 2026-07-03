import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class NotificationRecipientInput {
  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  employeeId?: string;
}

@InputType()
export class SendNotificationInput {
  @Field(() => NotificationRecipientInput)
  recipient!: NotificationRecipientInput;

  @Field()
  type!: string;

  @Field(() => [String], { nullable: true })
  channels?: string[];

  @Field()
  title!: string;

  @Field()
  body!: string;

  @Field({ nullable: true })
  dataJson?: string;

  @Field({ nullable: true })
  phoneNumber?: string;
}

@InputType()
export class NotificationPreferenceInput {
  @Field()
  type!: string;

  @Field()
  channel!: string;

  @Field()
  enabled!: boolean;
}

@InputType()
export class PushSubscriptionInput {
  @Field()
  endpoint!: string;

  @Field()
  p256dh!: string;

  @Field()
  auth!: string;

  @Field({ nullable: true })
  platform?: string;

  @Field({ nullable: true })
  provider?: string;
}
