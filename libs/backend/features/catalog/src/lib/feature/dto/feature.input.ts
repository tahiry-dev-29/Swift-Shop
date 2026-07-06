import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';

@InputType()
export class CreateFeatureInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  declare publicName: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;
}

@InputType()
export class UpdateFeatureInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  publicName?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;
}

@InputType()
export class CreateFeatureValueInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  declare value: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  custom?: boolean;
}

@InputType()
export class UpdateFeatureValueInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  value?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  custom?: boolean;
}
