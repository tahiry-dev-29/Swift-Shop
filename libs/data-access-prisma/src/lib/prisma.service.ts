import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
import { PrismaClient } from '@swift-shop/prisma-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  pool: Pool;

  constructor(configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });

    super({
      adapter: new PrismaNeon(pool),
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await this.pool.end();
      await app.close();
    });
    process.on('SIGTERM', async () => {
      await this.pool.end();
      process.exit(0);
    });
    process.on('SIGINT', async () => {
      await this.pool.end();
      process.exit(0);
    });
  }
}
