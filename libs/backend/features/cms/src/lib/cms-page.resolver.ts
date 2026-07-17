import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, EmployeeGuard } from '@swift-shop/backend/auth';
import { CmsPageService } from './cms-page.service';
import { CreateCmsPageInput, UpdateCmsPageInput, CmsPageType } from './dto';

@Resolver(() => CmsPageType)
export class CmsPageResolver {
  constructor(private readonly cmsPageService: CmsPageService) {}

  @Query(() => [CmsPageType])
  async cmsPages(@Args('activeOnly', { nullable: true }) activeOnly?: boolean) {
    return this.cmsPageService.listPages({ activeOnly });
  }

  @Query(() => CmsPageType)
  async cmsPageBySlug(@Args('slug') slug: string) {
    return this.cmsPageService.getPageBySlug(slug);
  }

  @Query(() => CmsPageType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async cmsPage(@Args('id', { type: () => ID }) id: string) {
    return this.cmsPageService.getPage(id);
  }

  @Mutation(() => CmsPageType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async createCmsPage(@Args('input') input: CreateCmsPageInput) {
    return this.cmsPageService.createPage(input);
  }

  @Mutation(() => CmsPageType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async updateCmsPage(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCmsPageInput,
  ) {
    return this.cmsPageService.updatePage(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async deleteCmsPage(@Args('id', { type: () => ID }) id: string) {
    return this.cmsPageService.deletePage(id);
  }
}
