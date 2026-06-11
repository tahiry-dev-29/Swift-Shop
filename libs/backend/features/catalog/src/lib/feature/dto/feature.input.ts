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
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  publicName: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;
}

@InputType()
export class UpdateFeatureInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
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
  value: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  custom?: boolean;
}

@InputType()
export class UpdateFeatureValueInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  value?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  custom?: boolean;
}
