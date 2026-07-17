import { ObjectType, Field, ID, Int, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsDate,
} from 'class-validator';

@ObjectType()
export class BannerType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  imageUrl!: string;

  @Field({ nullable: true })
  linkUrl?: string;

  @Field()
  active!: boolean;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;

  @Field(() => Int)
  position!: number;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@InputType()
export class CreateBannerInput {
  @Field()
  @IsString()
  title!: string;

  @Field()
  @IsString()
  imageUrl!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  dateTo?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;
}

@InputType()
export class UpdateBannerInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  dateTo?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  position?: number;
}
