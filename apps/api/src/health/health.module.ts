import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';

@Module({
  imports: [TerminusModule, DataAccessPrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
