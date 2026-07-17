import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class HomepageBlockType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  type!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  content?: unknown;

  @Field(() => Int)
  position!: number;

  @Field()
  active!: boolean;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@InputType()
export class CreateHomepageBlockInput {
  @Field()
  @IsString()
  title!: string;

  @Field()
  @IsString()
  type!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  content?: unknown;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@InputType()
export class UpdateHomepageBlockInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  type?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  content?: unknown;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@InputType()
export class ReorderHomepageBlocksInput {
  @Field(() => ID)
  @IsString()
  id!: string;

  @Field(() => Int)
  @IsInt()
  position!: number;
}
