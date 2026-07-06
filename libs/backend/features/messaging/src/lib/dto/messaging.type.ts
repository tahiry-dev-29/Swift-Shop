import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class EmailAttachmentType {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare messageId: string;

  @Field()
  declare fileUrl: string;

  @Field()
  declare fileName: string;

  @Field()
  declare mimeType: string;

  @Field(() => Int)
  declare size: number;

  @Field()
  declare createdAt: Date;
}

@ObjectType()
export class EmailMessageType {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare threadId: string;

  @Field({ nullable: true })
  declare senderId?: string;

  @Field({ nullable: true })
  declare recipientId?: string;

  @Field()
  declare body: string;

  @Field()
  declare status: string;

  @Field(() => [EmailAttachmentType], { nullable: true })
  declare attachments?: EmailAttachmentType[];

  @Field()
  declare createdAt: Date;
}

@ObjectType()
export class EmailThreadType {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare subject: string;

  @Field(() => [EmailMessageType], { nullable: true })
  declare messages?: EmailMessageType[];

  @Field()
  declare createdAt: Date;

  @Field()
  declare updatedAt: Date;
}
