import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, SuperAdminGuard } from '@dima-new/backend/auth';
import { AnalyticsService } from './analytics.service';
import {
  DashboardStatsType,
  ProductViewEventType,
  SalesChartPointType,
  TopProductType,
  TrackProductViewInput,
} from './dto';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => DashboardStatsType)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  getDashboardStats(
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
  ) {
    return this.analyticsService.getDashboardStats({ from, to });
  }

  @Query(() => [SalesChartPointType])
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  getSalesChart(
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
  ) {
    return this.analyticsService.getSalesChart({ from, to });
  }

  @Query(() => [TopProductType])
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  getTopProducts(
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ) {
    return this.analyticsService.getTopProducts({ from, to }, limit);
  }

  @Mutation(() => ProductViewEventType)
  trackProductView(@Args('input') input: TrackProductViewInput) {
    return this.analyticsService.trackProductView(input);
  }
}
