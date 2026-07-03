import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
}

@InputType()
export class CreateSocialPostInput {
  @Field()
  @IsString()
  content!: string;

  @Field()
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
