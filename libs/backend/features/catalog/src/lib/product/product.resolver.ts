import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
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

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  

  @Query(() => ProductListType)
  async products(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput
  ) {
    return this.productService.findAll(filter);
  }

  @Query(() => ProductType)
  async product(@Args('id', { type: () => Int }) id: number) {
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
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateProductInput
  ) {
    return this.productService.update(id, input);
  }

  @Mutation(() => ProductType)
  @UseGuards(SuperAdminGuard)
  async deleteProduct(@Args('id', { type: () => Int }) id: number) {
    return this.productService.delete(id);
  }

  

  @Mutation(() => ProductImageType)
  @UseGuards(SuperAdminGuard)
  async addProductImage(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('input') input: CreateProductImageInput
  ) {
    return this.productService.addImage(productId, input);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(SuperAdminGuard)
  async removeProductImage(@Args('id', { type: () => Int }) id: number) {
    return this.productService.removeImage(id);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(SuperAdminGuard)
  async setProductCoverImage(@Args('imageId', { type: () => Int }) imageId: number) {
    return this.productService.setCoverImage(imageId);
  }

  

  @Mutation(() => ProductCombinationType)
  @UseGuards(SuperAdminGuard)
  async addProductCombination(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('input') input: CreateProductCombinationInput
  ) {
    return this.productService.addCombination(productId, input);
  }

  @Mutation(() => ProductCombinationType)
  @UseGuards(SuperAdminGuard)
  async updateProductCombination(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateProductCombinationInput
  ) {
    return this.productService.updateCombination(id, input);
  }

  @Mutation(() => ProductCombinationType)
  @UseGuards(SuperAdminGuard)
  async deleteProductCombination(@Args('id', { type: () => Int }) id: number) {
    return this.productService.deleteCombination(id);
  }

  

  @Mutation(() => StockType)
  @UseGuards(SuperAdminGuard)
  async updateStock(@Args('input') input: UpdateStockInput) {
    return this.productService.updateStock(input);
  }

  @Mutation(() => StockType)
  @UseGuards(SuperAdminGuard)
  async incrementStock(
    @Args('stockId', { type: () => Int }) stockId: number,
    @Args('quantity', { type: () => Int }) quantity: number
  ) {
    return this.productService.incrementStock(stockId, quantity);
  }

  @Mutation(() => StockType)
  @UseGuards(SuperAdminGuard)
  async decrementStock(
    @Args('stockId', { type: () => Int }) stockId: number,
    @Args('quantity', { type: () => Int }) quantity: number
  ) {
    return this.productService.decrementStock(stockId, quantity);
  }

  @Query(() => Boolean)
  async checkProductAvailability(
    @Args('productId', { type: () => Int, nullable: true }) productId?: number,
    @Args('combinationId', { type: () => Int, nullable: true }) combinationId?: number,
    @Args('quantity', { type: () => Int, nullable: true }) quantity?: number
  ) {
    return this.productService.checkAvailability(productId, combinationId, quantity);
  }
}
