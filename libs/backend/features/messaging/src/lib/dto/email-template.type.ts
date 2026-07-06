import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EmailTemplateType {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare name: string;

  @Field()
  declare subject: string;

  @Field()
  declare bodyHtml: string;

  @Field()
  declare createdAt: Date;

  @Field()
  declare updatedAt: Date;
}
