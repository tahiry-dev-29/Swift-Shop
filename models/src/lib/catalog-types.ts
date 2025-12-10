// Catalog Models - shared types for Product, Category, Attribute

export interface ProductModel {
  id: string;
  reference: string;
  name: string;
  description?: string;
  descriptionShort?: string;
  price: number;
  wholesalePrice: number;
  active: boolean;
  availableForOrder: boolean;
  showPrice: boolean;
  metaTitle?: string;
  metaDescription?: string;
  linkRewrite?: string;
  weight: number;
  width?: number;
  height?: number;
  depth?: number;
  categoryId?: string;
}

export interface CategoryModel {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  position: number;
  parentId?: string;
}

export interface AttributeGroupModel {
  id: string;
  name: string;
  publicName: string;
  position: number;
  type: string;
}

export interface AttributeValueModel {
  id: string;
  attributeGroupId: string;
  name: string;
  color?: string;
  position: number;
}

export interface ProductImageModel {
  id: string;
  productId: string;
  position: number;
  cover: boolean;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  alt?: string;
}

export interface ProductCombinationModel {
  id: string;
  productId: string;
  reference?: string;
  priceImpact: number;
  weightImpact: number;
  active: boolean;
  isDefault: boolean;
}

export interface StockModel {
  id: string;
  productId?: string;
  combinationId?: string;
  quantity: number;
  minQuantity: number;
  outOfStockBehavior: string;
}
