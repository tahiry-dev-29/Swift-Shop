import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import {
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { SuperAdminGuard } from '@dima-new/backend/auth';
import { CategoryType, CreateCategoryInput, UpdateCategoryInput } from './dto';

@Resolver()
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => [CategoryType])
  async categories() {
    return this.categoryService.findAll();
  }

  @Query(() => [CategoryType])
  async categoryTree() {
    return this.categoryService.findTree();
  }

  @Query(() => CategoryType)
  async category(@Args('id', { type: () => ID }) id: string) {
    const category = await this.categoryService.findById(id);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  @Query(() => [String])
  async categoryPath(@Args('id', { type: () => ID }) id: string) {
    return this.categoryService.getPath(id);
  }

  @Mutation(() => CategoryType)
  @UseGuards(SuperAdminGuard)
  async createCategory(@Args('input') input: CreateCategoryInput) {
    return this.categoryService.create(input);
  }

  @Mutation(() => CategoryType)
  @UseGuards(SuperAdminGuard)
  async updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCategoryInput,
  ) {
    const category = await this.categoryService.findById(id);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return this.categoryService.update(id, input);
  }

  @Mutation(() => CategoryType)
  @UseGuards(SuperAdminGuard)
  async deleteCategory(@Args('id', { type: () => ID }) id: string) {
    const category = await this.categoryService.findById(id);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    try {
      return await this.categoryService.delete(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
