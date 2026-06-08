import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  CreateFeatureInput,
  UpdateFeatureInput,
  CreateFeatureValueInput,
  UpdateFeatureValueInput,
} from './dto';

@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllFeatures() {
    return this.prisma.feature.findMany({
      orderBy: { position: 'asc' },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
    });
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
    return this.prisma.feature.create({
      data: input,
    });
  }

  async updateFeature(id: string, input: UpdateFeatureInput) {
    return this.prisma.feature.update({
      where: { id },
      data: input,
      include: { values: true },
    });
  }

  async deleteFeature(id: string) {
    return this.prisma.feature.delete({
      where: { id },
    });
  }

  async findValueById(id: string) {
    return this.prisma.featureValue.findUnique({
      where: { id },
    });
  }

  async createValue(featureId: string, input: CreateFeatureValueInput) {
    return this.prisma.featureValue.create({
      data: {
        ...input,
        featureId,
      },
    });
  }

  async updateValue(id: string, input: UpdateFeatureValueInput) {
    return this.prisma.featureValue.update({
      where: { id },
      data: input,
    });
  }

  async deleteValue(id: string) {
    return this.prisma.featureValue.delete({
      where: { id },
    });
  }
}
