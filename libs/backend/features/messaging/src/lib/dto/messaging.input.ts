import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field({ nullable: true })
  declare recipientId?: string;

  @Field()
  declare subject: string;

  @Field()
  declare body: string;
}

@InputType()
export class ReplyToThreadInput {
  @Field()
  declare threadId: string;

  @Field()
  declare body: string;
}

@InputType()
export class CreateEmailTemplateInput {
  @Field()
  declare name: string;

  @Field()
  declare subject: string;

  @Field()
  declare bodyHtml: string;
}

@InputType()
export class UpdateEmailTemplateInput {
  @Field({ nullable: true })
  declare name?: string;

  @Field({ nullable: true })
  declare subject?: string;

  @Field({ nullable: true })
  declare bodyHtml?: string;
}
