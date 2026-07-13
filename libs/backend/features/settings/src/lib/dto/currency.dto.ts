import { ObjectType, Field, ID, InputType, Float } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

@ObjectType()
export class CurrencyType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  code!: string;

  @Field()
  symbol!: string;

  @Field(() => Float)
  exchangeRate!: number;

  @Field()
  isDefault!: boolean;

  @Field()
  active!: boolean;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@InputType()
export class CreateCurrencyInput {
  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsString()
  code!: string;

  @Field()
  @IsString()
  symbol!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@InputType()
export class UpdateCurrencyInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  symbol?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
