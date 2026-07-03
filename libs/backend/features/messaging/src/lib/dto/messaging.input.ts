import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field({ nullable: true })
  recipientId?: string;

  @Field()
  subject: string;

  @Field()
  body: string;
}

@InputType()
export class ReplyToThreadInput {
  @Field()
  threadId: string;

  @Field()
  body: string;
}

@InputType()
export class CreateEmailTemplateInput {
  @Field()
  name: string;

  @Field()
  subject: string;

  @Field()
  bodyHtml: string;
}

@InputType()
export class UpdateEmailTemplateInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  bodyHtml?: string;
}
