import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class SocialPostType {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field()
  platform!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  scheduledFor?: Date;

  @Field({ nullable: true })
  publishedAt?: Date;

  @Field(() => [String])
  mediaUrls!: string[];

  @Field({ nullable: true })
  externalId?: string;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  employeeId?: string;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@ObjectType()
export class SocialPostListType {
  @Field(() => [SocialPostType])
  items!: SocialPostType[];

  @Field(() => Int)
  total!: number;
}
