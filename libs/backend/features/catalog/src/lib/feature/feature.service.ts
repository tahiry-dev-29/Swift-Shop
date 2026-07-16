import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import {
  CreateFeatureInput,
  UpdateFeatureInput,
  CreateFeatureValueInput,
  UpdateFeatureValueInput,
} from './dto';
import Redis from 'ioredis';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);
  private redis: Redis | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private getClient(): Redis | null {
    if (!this.redis) {
      this.redis = new Redis(
        process.env['REDIS_URL'] || 'redis://localhost:6379',
        {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        },
      );
      this.redis.on('error', (err) =>
        this.logger.error('Redis feature service error', err),
      );
      this.redis.connect().catch(() => {
        this.logger.warn('Redis not available — feature cache disabled');
      });
    }
    return this.redis;
  }

  private async invalidateCache() {
    const client = this.getClient();
    if (!client) return;
    try {
      await client.del('features:all');
    } catch {
      this.logger.warn('Failed to invalidate feature cache');
    }
  }

  async findAllFeatures() {
    const client = this.getClient();
    if (!client) return this.prisma.feature.findMany({
      orderBy: { position: 'asc' },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
    });
    try {
      const cached = await client.get('features:all');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore cache miss
    }

    const features = await this.prisma.feature.findMany({
      orderBy: { position: 'asc' },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
    });

    try {
      await client.set('features:all', JSON.stringify(features), 'EX', 3600);
    } catch {
      this.logger.warn('Failed to cache features');
    }

    return features;
  }

  async findFeatureById(id: string) {
    return this.prisma.feature.findUnique({
      where: { id },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async createFeature(input: CreateFeatureInput) {
    const result = await this.prisma.feature.create({
      data: input,
    });
    await this.invalidateCache();
    return result;
  }

  async updateFeature(id: string, input: UpdateFeatureInput) {
    const result = await this.prisma.feature.update({
      where: { id },
      data: input,
      include: { values: true },
    });
    await this.invalidateCache();
    return result;
  }

  async deleteFeature(id: string) {
    const result = await this.prisma.feature.delete({
      where: { id },
    });
    await this.invalidateCache();
    return result;
  }

  async findValueById(id: string) {
    return this.prisma.featureValue.findUnique({
      where: { id },
    });
  }

  async createValue(featureId: string, input: CreateFeatureValueInput) {
    const result = await this.prisma.featureValue.create({
      data: {
        ...input,
        featureId,
      },
    });
    await this.invalidateCache();
    return result;
  }

  async updateValue(id: string, input: UpdateFeatureValueInput) {
    const result = await this.prisma.featureValue.update({
      where: { id },
      data: input,
    });
    await this.invalidateCache();
    return result;
  }

  async deleteValue(id: string) {
    const result = await this.prisma.featureValue.delete({
      where: { id },
    });
    await this.invalidateCache();
    return result;
  }
}
