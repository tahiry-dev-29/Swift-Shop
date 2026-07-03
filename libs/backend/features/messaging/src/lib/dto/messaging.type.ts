import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class EmailAttachmentType {
  @Field(() => ID)
  id: string;

  @Field()
  messageId: string;

  @Field()
  fileUrl: string;

  @Field()
  fileName: string;

  @Field()
  mimeType: string;

  @Field(() => Int)
  size: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class EmailMessageType {
  @Field(() => ID)
  id: string;

  @Field()
  threadId: string;

  @Field({ nullable: true })
  senderId?: string;

  @Field({ nullable: true })
  recipientId?: string;

  @Field()
  body: string;

  @Field()
  status: string;

  @Field(() => [EmailAttachmentType], { nullable: true })
  attachments?: EmailAttachmentType[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class EmailThreadType {
  @Field(() => ID)
  id: string;

  @Field()
  subject: string;

  @Field(() => [EmailMessageType], { nullable: true })
  messages?: EmailMessageType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
