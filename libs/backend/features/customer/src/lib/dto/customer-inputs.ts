import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CustomerRegisterInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field(() => Int)
  groupId!: number;

  @Field({ nullable: true })
  birthday?: Date;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true, defaultValue: false })
  optin?: boolean;
}
