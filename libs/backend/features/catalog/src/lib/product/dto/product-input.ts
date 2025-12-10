import { InputType, Field, Int, Float, ID } from '@nestjs/graphql';


@InputType()
export class CreateProductInput {
  @Field()
  reference!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  descriptionShort?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  wholesalePrice?: number;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  availableForOrder?: boolean;

  @Field({ nullable: true })
  showPrice?: boolean;

  @Field({ nullable: true })
  metaTitle?: string;

  @Field({ nullable: true })
  metaDescription?: string;

  @Field({ nullable: true })
  linkRewrite?: string;

  @Field(() => Float, { nullable: true })
  weight?: number;

  @Field(() => Float, { nullable: true })
  width?: number;

  @Field(() => Float, { nullable: true })
  height?: number;

  @Field(() => Float, { nullable: true })
  depth?: number;

  @Field(() => ID, { nullable: true })
  categoryId?: string;
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  reference?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  descriptionShort?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  wholesalePrice?: number;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  availableForOrder?: boolean;

  @Field({ nullable: true })
  showPrice?: boolean;

  @Field({ nullable: true })
  metaTitle?: string;

  @Field({ nullable: true })
  metaDescription?: string;

  @Field({ nullable: true })
  linkRewrite?: string;

  @Field(() => Float, { nullable: true })
  weight?: number;

  @Field(() => Float, { nullable: true })
  width?: number;

  @Field(() => Float, { nullable: true })
  height?: number;

  @Field(() => Float, { nullable: true })
  depth?: number;

  @Field(() => ID, { nullable: true })
  categoryId?: string;
}


@InputType()
export class CreateProductImageInput {
  @Field()
  filename!: string;

  @Field()
  originalName!: string;

  @Field()
  path!: string;

  @Field()
  mimeType!: string;

  @Field(() => Int)
  size!: number;

  @Field({ nullable: true })
  alt?: string;

  @Field({ nullable: true })
  cover?: boolean;

  @Field(() => Int, { nullable: true })
  position?: number;
}


@InputType()
export class CreateProductCombinationInput {
  @Field({ nullable: true })
  reference?: string;

  @Field(() => Float, { nullable: true })
  priceImpact?: number;

  @Field(() => Float, { nullable: true })
  weightImpact?: number;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  isDefault?: boolean;

  @Field(() => [ID])
  attributeValueIds!: string[];
}

@InputType()
export class UpdateProductCombinationInput {
  @Field({ nullable: true })
  reference?: string;

  @Field(() => Float, { nullable: true })
  priceImpact?: number;

  @Field(() => Float, { nullable: true })
  weightImpact?: number;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  isDefault?: boolean;
}


@InputType()
export class UpdateStockInput {
  @Field(() => ID, { nullable: true })
  productId?: string;

  @Field(() => ID, { nullable: true })
  combinationId?: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int, { nullable: true })
  minQuantity?: number;

  @Field({ nullable: true })
  outOfStockBehavior?: string;
}


@InputType()
export class ProductFilterInput {
  @Field(() => ID, { nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  search?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  take?: number;
}

