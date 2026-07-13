import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional, IsUrl } from 'class-validator';

@ObjectType()
export class StoreType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  url?: string;

  @Field()
  active!: boolean;

  @Field()
  isDefault!: boolean;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@InputType()
export class CreateStoreInput {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  url?: string;

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
export class UpdateStoreInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  url?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
