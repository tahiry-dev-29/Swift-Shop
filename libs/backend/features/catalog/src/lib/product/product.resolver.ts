import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { SuperAdminGuard } from '@dima-new/backend/auth';
import {
  ProductType,
  ProductListType,
  ProductImageType,
  ProductCombinationType,
  StockType,
  CreateProductInput,
  UpdateProductInput,
  CreateProductImageInput,
  CreateProductCombinationInput,
  UpdateProductCombinationInput,
  UpdateStockInput,
  ProductFilterInput,
} from './dto';

import { ProductCombinationService } from './product-combination.service';
import { ProductImageService } from './product-image.service';
import { ProductStockService } from './product-stock.service';
import { ProductDuplicateService } from './product-duplicate.service';

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly imageService: ProductImageService,
    private readonly combinationService: ProductCombinationService,
    private readonly stockService: ProductStockService,
    private readonly duplicateService: ProductDuplicateService,
  ) {}

  @Query(() => ProductListType)
  async products(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ) {
    return this.productService.findAll(filter);
  }

  @Query(() => ProductType)
  async product(@Args('id', { type: () => ID }) id: string) {
    return this.productService.findById(id);
  }

  @Mutation(() => ProductType)
  @UseGuards(SuperAdminGuard)
  async createProduct(@Args('input') input: CreateProductInput) {
    return this.productService.create(input);
  }

  @Mutation(() => ProductType)
  @UseGuards(SuperAdminGuard)
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ) {
    return this.productService.update(id, input);
  }

  @Mutation(() => ProductType)
  @UseGuards(SuperAdminGuard)
  async duplicateProduct(@Args('id', { type: () => ID }) id: string) {
    return this.duplicateService.duplicate(id);
  }

  @Mutation(() => ProductType)
  @UseGuards(SuperAdminGuard)
  async deleteProduct(@Args('id', { type: () => ID }) id: string) {
    return this.productService.delete(id);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(SuperAdminGuard)
  async addProductImage(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('input') input: CreateProductImageInput,
  ) {
    return this.imageService.addImage(productId, input);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(SuperAdminGuard)
  async removeProductImage(@Args('id', { type: () => ID }) id: string) {
    return this.imageService.removeImage(id);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(SuperAdminGuard)
  async setProductCoverImage(
    @Args('imageId', { type: () => ID }) imageId: string,
  ) {
    return this.imageService.setCoverImage(imageId);
  }

  @Mutation(() => ProductCombinationType)
  @UseGuards(SuperAdminGuard)
  async addProductCombination(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('input') input: CreateProductCombinationInput,
  ) {
    return this.combinationService.addCombination(productId, input);
  }

  @Mutation(() => ProductCombinationType)
  @UseGuards(SuperAdminGuard)
  async updateProductCombination(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductCombinationInput,
  ) {
    return this.combinationService.updateCombination(id, input);
  }

  @Mutation(() => ProductCombinationType)
  @UseGuards(SuperAdminGuard)
  async deleteProductCombination(@Args('id', { type: () => ID }) id: string) {
    return this.combinationService.deleteCombination(id);
  }

  @Mutation(() => StockType)
  @UseGuards(SuperAdminGuard)
  async updateStock(@Args('input') input: UpdateStockInput) {
    return this.stockService.updateStock(input);
  }

  @Mutation(() => StockType)
  @UseGuards(SuperAdminGuard)
  async incrementStock(
    @Args('stockId', { type: () => ID }) stockId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    return this.stockService.incrementStock(stockId, quantity);
  }

  @Mutation(() => StockType)
  @UseGuards(SuperAdminGuard)
  async decrementStock(
    @Args('stockId', { type: () => ID }) stockId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    return this.stockService.decrementStock(stockId, quantity);
  }

  @Query(() => Boolean)
  async checkProductAvailability(
    @Args('productId', { type: () => ID, nullable: true }) productId?: string,
    @Args('combinationId', { type: () => ID, nullable: true })
    combinationId?: string,
    @Args('quantity', { type: () => Int, nullable: true }) quantity?: number,
  ) {
    return this.stockService.checkAvailability(
      productId,
      combinationId,
      quantity,
    );
  }
}
