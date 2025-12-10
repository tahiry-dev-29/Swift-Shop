import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class ProductImageType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  productId!: number;

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
  @Field(() => Int)
  id!: number;

  @Field(() => Int, { nullable: true })
  productId?: number;

  @Field(() => Int, { nullable: true })
  combinationId?: number;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  minQuantity!: number;

  @Field()
  outOfStockBehavior!: string;
}

@ObjectType()
export class ProductCombinationAttributeType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  combinationId!: number;

  @Field(() => Int)
  attributeValueId!: number;
}

@ObjectType()
export class ProductCombinationType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  productId!: number;

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
  @Field(() => Int)
  id!: number;

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

  @Field(() => Int, { nullable: true })
  categoryId?: number;

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
