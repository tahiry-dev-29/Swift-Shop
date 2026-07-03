import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { CustomerModule } from '@dima-new/backend/customer';
import { EmployeeModule } from '@dima-new/backend/employee';
import { CustomerGroupModule } from '@dima-new/backend/customer-group';
import { AddressModule } from '@dima-new/backend/address';
import { CatalogModule } from '@dima-new/backend/catalog';
import { PricingModule } from '@dima-new/backend/pricing';
import { CartModule } from '@dima-new/backend/cart';
import { OrderModule } from '@dima-new/backend/order';
import { ShippingModule } from '@dima-new/backend/shipping';
import { PaymentModule } from '@dima-new/backend/payment';
import { AnalyticsModule } from '@dima-new/backend/analytics';
import { SearchModule } from '@dima-new/backend/search';
import { MediaModule } from '@dima-new/backend/media';
import { SettingsModule } from '@dima-new/backend/settings';
import { MessagingModule } from '@dima-new/backend/messaging';
import { SupportModule } from '@backend/features/support';
import { NotificationModule } from '@dima-new/backend/notifications';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(__dirname, 'schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req, res }) => ({ req, res }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),

    ScheduleModule.forRoot(),

    BullModule.forRoot({
      connection: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
      },
    }),

    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),

    DataAccessPrismaModule,

    AuthModule,
    CustomerModule,
    EmployeeModule,
    CustomerGroupModule,
    AddressModule,
    CatalogModule,
    PricingModule,
    CartModule,
    OrderModule,
    ShippingModule,
    PaymentModule,
    AnalyticsModule,
    SearchModule,
    MediaModule,
    SettingsModule,
    MessagingModule,
    SupportModule,
    NotificationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
