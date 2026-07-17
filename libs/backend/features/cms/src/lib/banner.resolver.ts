import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, EmployeeGuard } from '@swift-shop/backend/auth';
import { BannerService } from './banner.service';
import { CreateBannerInput, UpdateBannerInput, BannerType } from './dto';

@Resolver(() => BannerType)
export class BannerResolver {
  constructor(private readonly bannerService: BannerService) {}

  @Query(() => [BannerType])
  async banners(@Args('activeOnly', { nullable: true }) activeOnly?: boolean) {
    return this.bannerService.listBanners({ activeOnly });
  }

  @Query(() => BannerType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async banner(@Args('id', { type: () => ID }) id: string) {
    return this.bannerService.getBanner(id);
  }

  @Mutation(() => BannerType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async createBanner(@Args('input') input: CreateBannerInput) {
    return this.bannerService.createBanner(input);
  }

  @Mutation(() => BannerType)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async updateBanner(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBannerInput,
  ) {
    return this.bannerService.updateBanner(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  async deleteBanner(@Args('id', { type: () => ID }) id: string) {
    return this.bannerService.deleteBanner(id);
  }
}
