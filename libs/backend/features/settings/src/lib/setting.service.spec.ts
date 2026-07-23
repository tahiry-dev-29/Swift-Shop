import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingService } from './setting.service';
import { PrismaService } from '@swift-shop/data-access-prisma';

describe('SettingService', () => {
  let service: SettingService;
  let prismaMock: {
    setting: {
      findUnique: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      setting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    };

    service = new SettingService(prismaMock as unknown as PrismaService);
  });

  describe('get', () => {
    it('should return null when setting is not found', async () => {
      prismaMock.setting.findUnique.mockResolvedValue(null);
      const res = await service.get('nonexistent');
      expect(res).toBeNull();
    });

    it('should parse boolean values correctly', async () => {
      prismaMock.setting.findUnique.mockResolvedValue({
        key: 'site_maintenance',
        value: 'true',
        type: 'boolean',
      });
      const res = await service.get('site_maintenance');
      expect(res).toBe(true);
    });

    it('should parse number values correctly', async () => {
      prismaMock.setting.findUnique.mockResolvedValue({
        key: 'max_items_per_order',
        value: '50',
        type: 'number',
      });
      const res = await service.get('max_items_per_order');
      expect(res).toBe(50);
    });

    it('should parse json values correctly', async () => {
      prismaMock.setting.findUnique.mockResolvedValue({
        key: 'theme_config',
        value: '{"mode":"dark","primaryColor":"#ff0000"}',
        type: 'json',
      });
      const res = await service.get('theme_config');
      expect(res).toEqual({ mode: 'dark', primaryColor: '#ff0000' });
    });

    it('should return string as is for default type', async () => {
      prismaMock.setting.findUnique.mockResolvedValue({
        key: 'site_name',
        value: 'Swift Shop',
        type: 'string',
      });
      const res = await service.get('site_name');
      expect(res).toBe('Swift Shop');
    });
  });

  describe('set', () => {
    it('should stringify json before upserting', async () => {
      prismaMock.setting.upsert.mockResolvedValue({
        key: 'config',
        value: '{"a":1}',
        type: 'json',
        group: 'general',
        isPublic: false,
      });

      await service.set('config', { a: 1 }, 'json', 'general', false);

      expect(prismaMock.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'config' },
        update: {
          value: '{"a":1}',
          type: 'json',
          group: 'general',
          isPublic: false,
          description: undefined,
        },
        create: {
          key: 'config',
          value: '{"a":1}',
          type: 'json',
          group: 'general',
          isPublic: false,
          description: undefined,
        },
      });
    });
  });

  describe('getGroup', () => {
    it('should return parsed key-value map for specified group', async () => {
      prismaMock.setting.findMany.mockResolvedValue([
        { key: 'item_1', value: '100', type: 'number' },
        { key: 'item_2', value: 'true', type: 'boolean' },
      ]);

      const groupSettings = await service.getGroup('store');

      expect(groupSettings).toEqual({
        item_1: 100,
        item_2: true,
      });
    });
  });

  describe('getPublicSettings', () => {
    it('should return parsed public settings', async () => {
      prismaMock.setting.findMany.mockResolvedValue([
        { key: 'public_logo', value: 'https://logo.jpg', type: 'string' },
      ]);

      const publicSettings = await service.getPublicSettings();

      expect(publicSettings).toEqual({
        public_logo: 'https://logo.jpg',
      });
    });
  });
});
