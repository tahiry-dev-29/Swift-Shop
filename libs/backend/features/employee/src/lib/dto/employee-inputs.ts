import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateEmployeeInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field(() => ID, { nullable: true })
  roleId?: string;
}

@InputType()
export class UpdateEmployeeInput {
  @Field({ nullable: true })
  firstname?: string;

  @Field({ nullable: true })
  lastname?: string;

  @Field(() => ID, { nullable: true })
  roleId?: string;

  @Field({ nullable: true })
  active?: boolean;
}

