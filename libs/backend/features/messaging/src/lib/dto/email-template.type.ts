import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EmailTemplateType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  subject: string;

  @Field()
  bodyHtml: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
