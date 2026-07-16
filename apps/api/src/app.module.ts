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
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { AuthModule } from '@swift-shop/backend/auth';
import { CustomerModule } from '@swift-shop/backend/customer';
import { EmployeeModule } from '@swift-shop/backend/employee';
import { CustomerGroupModule } from '@swift-shop/backend/customer-group';
import { AddressModule } from '@swift-shop/backend/address';
import { CatalogModule } from '@swift-shop/backend/catalog';
import { PricingModule } from '@swift-shop/backend/pricing';
import { CartModule } from '@swift-shop/backend/cart';
import { OrderModule } from '@swift-shop/backend/order';
import { ShippingModule } from '@swift-shop/backend/shipping';
import { PaymentModule } from '@swift-shop/backend/payment';
import { AnalyticsModule } from '@swift-shop/backend/analytics';
import { SearchModule } from '@swift-shop/backend/search';
import { MediaModule } from '@swift-shop/backend/media';
import { SettingsModule } from '@swift-shop/backend/settings';
import { SocialMediaModule } from '@swift-shop/backend/social-media';
import { MessagingModule } from '@swift-shop/backend/messaging';
import { SupportModule } from '@backend/features/support';
import { NotificationModule } from '@swift-shop/backend/notifications';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

import { depthLimit } from './config/graphql-depth.util';

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
      playground: process.env['NODE_ENV'] !== 'production',
      introspection: process.env['NODE_ENV'] !== 'production',
      validationRules: [depthLimit(10)],
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),

    ScheduleModule.forRoot(),

    BullModule.forRoot({
      connection: process.env['REDIS_URL']
        ? {
            url: process.env['REDIS_URL'],
            maxRetriesPerRequest: 0,
            retryStrategy: () => null,
            enableOfflineQueue: false,
            enableReadyCheck: false,
            lazyConnect: true,
            keyPrefix: 'swift-shop:',
          }
        : {
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: 0,
            retryStrategy: () => null,
            enableOfflineQueue: false,
            enableReadyCheck: false,
            lazyConnect: true,
            keyPrefix: 'swift-shop:',
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
    SocialMediaModule,
    MessagingModule,
    SupportModule,
    NotificationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
