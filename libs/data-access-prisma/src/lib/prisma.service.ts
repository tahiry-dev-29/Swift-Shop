import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@swift-shop/prisma-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
    const isNeon = databaseUrl.includes('.neon.tech');

    super({
      adapter: isNeon
        ? new PrismaNeon({
            connectionString: databaseUrl,
          })
        : new PrismaPg(databaseUrl),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });
    process.on('SIGTERM', async () => {
      await this.$disconnect();
      process.exit(0);
    });
    process.on('SIGINT', async () => {
      await this.$disconnect();
      process.exit(0);
    });
  }
}
