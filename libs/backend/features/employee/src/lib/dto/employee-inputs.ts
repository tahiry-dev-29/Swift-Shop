import { InputType, Field, Int } from '@nestjs/graphql';

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

  @Field(() => Int, { nullable: true })
  roleId?: number;
}

@InputType()
export class UpdateEmployeeInput {
  @Field({ nullable: true })
  firstname?: string;

  @Field({ nullable: true })
  lastname?: string;

  @Field(() => Int, { nullable: true })
  roleId?: number;

  @Field({ nullable: true })
  active?: boolean;
}
