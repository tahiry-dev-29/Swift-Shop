import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  SuperAdminGuard,
  OptionalCustomerGuard,
  CurrentUser,
} from '@dima-new/backend/auth';
import { AnalyticsService } from './analytics.service';
import {
  DashboardStatsType,
  ProductViewEventType,
  SalesChartPointType,
  TopProductType,
  TrackProductViewInput,
} from './dto';

interface CurrentUserType {
  id: string;
}

interface GraphQLContext {
  req: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
  };
}

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
  @UseGuards(OptionalCustomerGuard)
  trackProductView(
    @Context() context: GraphQLContext,
    @CurrentUser() user: CurrentUserType | null,
    @Args('input') input: TrackProductViewInput,
  ) {
    const ip =
      (context.req.headers['x-forwarded-for'] as string) || context.req.ip;

    return this.analyticsService.trackProductView({
      productId: input.productId,
      sessionId: input.sessionId,
      source: input.source,
      userAgent:
        input.userAgent || (context.req.headers['user-agent'] as string),
      customerId: user?.id,
      ipAddress: ip,
    });
  }
}
