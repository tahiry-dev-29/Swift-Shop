import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class ProductImageType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => Int)
  position!: number;

  @Field()
  cover!: boolean;

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

  @Field()
  dateAdd!: Date;
}

@ObjectType()
export class StockType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  productId?: string;

  @Field(() => ID, { nullable: true })
  combinationId?: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  minQuantity!: number;

  @Field()
  outOfStockBehavior!: string;
}

@ObjectType()
export class ProductCombinationAttributeType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  combinationId!: string;

  @Field(() => ID)
  attributeValueId!: string;
}

@ObjectType()
export class ProductCombinationType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field({ nullable: true })
  reference?: string;

  @Field(() => Float)
  priceImpact!: number;

  @Field(() => Float)
  weightImpact!: number;

  @Field()
  active!: boolean;

  @Field()
  isDefault!: boolean;

  @Field(() => [ProductCombinationAttributeType], { nullable: true })
  attributes?: ProductCombinationAttributeType[];

  @Field(() => StockType, { nullable: true })
  stock?: StockType;
}

@ObjectType()
export class ProductType {
  @Field(() => ID)
  id!: string;

  @Field()
  reference!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  descriptionShort?: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Float)
  wholesalePrice!: number;

  @Field()
  active!: boolean;

  @Field()
  availableForOrder!: boolean;

  @Field()
  showPrice!: boolean;

  @Field({ nullable: true })
  metaTitle?: string;

  @Field({ nullable: true })
  metaDescription?: string;

  @Field({ nullable: true })
  linkRewrite?: string;

  @Field(() => Float)
  weight!: number;

  @Field(() => Float, { nullable: true })
  width?: number;

  @Field(() => Float, { nullable: true })
  height?: number;

  @Field(() => Float, { nullable: true })
  depth?: number;

  @Field(() => ID, { nullable: true })
  categoryId?: string;

  @Field(() => [ProductImageType], { nullable: true })
  images?: ProductImageType[];

  @Field(() => [ProductCombinationType], { nullable: true })
  combinations?: ProductCombinationType[];

  @Field(() => StockType, { nullable: true })
  stock?: StockType;

  @Field()
  dateAdd!: Date;

  @Field()
  dateUpd!: Date;
}

@ObjectType()
export class ProductListType {
  @Field(() => [ProductType])
  items!: ProductType[];

  @Field(() => Int)
  total!: number;
}
