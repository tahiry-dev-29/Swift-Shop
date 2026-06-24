import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@dima-new/prisma-client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/** PrismaClient is an interface in v7 — use a castable constructor type to allow extends. */
const PrismaBase = PrismaClient as unknown as new (options: {
  adapter: PrismaPg;
}) => PrismaClient;

@Injectable()
export class PrismaService extends PrismaBase implements OnModuleInit {
  constructor(configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
