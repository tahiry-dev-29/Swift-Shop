import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AnalyticsFormatter } from './analytics.formatter';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    AnalyticsFormatter,
    AnalyticsRepository,
    AnalyticsResolver,
    AnalyticsService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
