import { Injectable } from '@nestjs/common';
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
  private redis = new Redis(
    process.env['REDIS_URL'] || 'redis://localhost:6379',
  );

  constructor(private readonly prisma: PrismaService) {}

  private async invalidateCache() {
    await this.redis.del('features:all');
  }

  async findAllFeatures() {
    const cached = await this.redis.get('features:all');
    if (cached) return JSON.parse(cached);

    const features = await this.prisma.feature.findMany({
      orderBy: { position: 'asc' },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
    });

    await this.redis.set('features:all', JSON.stringify(features), 'EX', 3600);
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
