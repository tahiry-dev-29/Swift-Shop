import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, EmployeeGuard } from '@swift-shop/backend/auth';
import { HomepageService } from './homepage.service';
import {
  CreateHomepageBlockInput,
  UpdateHomepageBlockInput,
  ReorderHomepageBlocksInput,
  HomepageBlockType,
} from './dto';

@Resolver(() => HomepageBlockType)
export class HomepageResolver {
  constructor(private readonly homepageService: HomepageService) {}

  @Query(() => [HomepageBlockType])
  async homepageBlocks(
    @Args('activeOnly', { nullable: true }) activeOnly?: boolean,
  ) {
    return this.homepageService.listBlocks({ activeOnly });
  }

  @Query(() => HomepageBlockType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async homepageBlock(@Args('id', { type: () => ID }) id: string) {
    return this.homepageService.getBlock(id);
  }

  @Mutation(() => HomepageBlockType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async createHomepageBlock(@Args('input') input: CreateHomepageBlockInput) {
    return this.homepageService.createBlock(input);
  }

  @Mutation(() => HomepageBlockType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async updateHomepageBlock(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateHomepageBlockInput,
  ) {
    return this.homepageService.updateBlock(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async deleteHomepageBlock(@Args('id', { type: () => ID }) id: string) {
    return this.homepageService.deleteBlock(id);
  }

  @Mutation(() => [HomepageBlockType])
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async reorderHomepageBlocks(
    @Args('input', { type: () => [ReorderHomepageBlocksInput] })
    input: ReorderHomepageBlocksInput[],
  ) {
    return this.homepageService.reorderBlocks(input);
  }
}
