import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TicketMessageType {
  @Field(() => ID)
  id!: string;

  @Field()
  senderType!: string;

  @Field(() => ID, { nullable: true })
  senderId?: string;

  @Field()
  content!: string;

  @Field()
  isInternal!: boolean;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class SupportTicketType {
  @Field(() => ID)
  id!: string;

  @Field()
  reference!: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  employeeId?: string;

  @Field()
  subject!: string;

  @Field()
  status!: string;

  @Field()
  priority!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [TicketMessageType])
  messages!: TicketMessageType[];
}

@InputType()
export class CreateTicketInput {
  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field()
  subject!: string;

  @Field()
  message!: string;

  @Field({ nullable: true, defaultValue: 'NORMAL' })
  priority?: string;
}

@InputType()
export class ReplyTicketInput {
  senderType?: string;

  senderId?: string;

  @Field()
  content!: string;

  @Field({ nullable: true, defaultValue: false })
  isInternal?: boolean;
}

@InputType()
export class AssignTicketInput {
  @Field(() => ID)
  employeeId!: string;
}
