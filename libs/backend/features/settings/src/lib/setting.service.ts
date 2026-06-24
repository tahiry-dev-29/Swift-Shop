import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    if (!setting) return null;
    return this.parseValue(setting.value, setting.type);
  }

  async set(
    key: string,
    value: unknown,
    type = 'string',
    group = 'general',
    isPublic = false,
    description?: string,
  ) {
    const stringValue = this.stringifyValue(value, type);

    return this.prisma.setting.upsert({
      where: { key },
      update: {
        value: stringValue,
        type,
        group,
        isPublic,
        description,
      },
      create: {
        key,
        value: stringValue,
        type,
        group,
        isPublic,
        description,
      },
    });
  }

  async getGroup(group: string) {
    const settings = await this.prisma.setting.findMany({
      where: { group },
    });

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = this.parseValue(setting.value, setting.type);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  async getPublicSettings() {
    const settings = await this.prisma.setting.findMany({
      where: { isPublic: true },
    });

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = this.parseValue(setting.value, setting.type);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  private parseValue(value: string, type: string): unknown {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return Number(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return value;
    }
  }

  private stringifyValue(value: unknown, type: string): string {
    if (type === 'json') return JSON.stringify(value);
    return String(value);
  }
}
