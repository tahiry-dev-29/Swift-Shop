import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateAttributeGroupInput {
  @Field()
  name!: string;

  @Field()
  publicName!: string;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field({ nullable: true })
  type?: string;
}

@InputType()
export class UpdateAttributeGroupInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  publicName?: string;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field({ nullable: true })
  type?: string;
}

@InputType()
export class CreateAttributeValueInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => Int, { nullable: true })
  position?: number;
}

@InputType()
export class UpdateAttributeValueInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => Int, { nullable: true })
  position?: number;
}
