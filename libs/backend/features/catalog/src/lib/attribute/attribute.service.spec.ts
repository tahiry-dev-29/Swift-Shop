import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AttributeService } from './attribute.service';
import { PrismaService } from '@swift-shop/data-access-prisma';

function makePrisma(): Mocked<PrismaService> {
  return {
    attributeGroup: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    attributeValue: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

describe('AttributeService', () => {
  let service: AttributeService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new AttributeService(prisma);
  });

  // ─── findAllGroups ────────────────────────────────────────────────────────

  describe('findAllGroups', () => {
    it('should return all attribute groups ordered by position with values', async () => {
      const groups = [{ id: 'ag1', name: 'Size', values: [] }] as never;
      prisma.attributeGroup.findMany.mockResolvedValue(groups);

      const result = await service.findAllGroups();
      expect(result).toBe(groups);
      expect(prisma.attributeGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { position: 'asc' } }),
      );
    });
  });

  // ─── findGroupById ────────────────────────────────────────────────────────

  describe('findGroupById', () => {
    it('should return the group with its values', async () => {
      const group = {
        id: 'ag1',
        name: 'Size',
        values: [{ id: 'av1', value: 'S' }],
      } as never;
      prisma.attributeGroup.findUnique.mockResolvedValue(group);

      const result = await service.findGroupById('ag1');
      expect(result).toBe(group);
    });

    it('should return null when group does not exist', async () => {
      prisma.attributeGroup.findUnique.mockResolvedValue(null);

      const result = await service.findGroupById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── createGroup ──────────────────────────────────────────────────────────

  describe('createGroup', () => {
    it('should create and return a new attribute group', async () => {
      const created = { id: 'ag1', name: 'Color', position: 0 } as never;
      prisma.attributeGroup.create.mockResolvedValue(created);

      const result = await service.createGroup({ name: 'Color', position: 0 });
      expect(result).toBe(created);
      expect(prisma.attributeGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Color', position: 0 } }),
      );
    });
  });

  // ─── updateGroup ──────────────────────────────────────────────────────────

  describe('updateGroup', () => {
    it('should update the group and return updated result with values', async () => {
      const updated = { id: 'ag1', name: 'Colour', values: [] } as never;
      prisma.attributeGroup.update.mockResolvedValue(updated);

      const result = await service.updateGroup('ag1', { name: 'Colour' });
      expect(result).toBe(updated);
      expect(prisma.attributeGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ag1' },
          data: { name: 'Colour' },
          include: { values: true },
        }),
      );
    });
  });

  // ─── deleteGroup ──────────────────────────────────────────────────────────

  describe('deleteGroup', () => {
    it('should delete the group by id', async () => {
      const deleted = { id: 'ag1' } as never;
      prisma.attributeGroup.delete.mockResolvedValue(deleted);

      const result = await service.deleteGroup('ag1');
      expect(result).toBe(deleted);
      expect(prisma.attributeGroup.delete).toHaveBeenCalledWith({
        where: { id: 'ag1' },
      });
    });
  });

  // ─── Attribute Values ─────────────────────────────────────────────────────

  describe('createValue', () => {
    it('should create an attribute value linked to the group', async () => {
      const created = {
        id: 'av1',
        value: 'XL',
        attributeGroupId: 'ag1',
      } as never;
      prisma.attributeValue.create.mockResolvedValue(created);

      const result = await service.createValue('ag1', {
        value: 'XL',
        position: 0,
      });
      expect(prisma.attributeValue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attributeGroupId: 'ag1',
            value: 'XL',
          }),
        }),
      );
      expect(result).toBe(created);
    });
  });

  describe('updateValue', () => {
    it('should update an attribute value', async () => {
      const updated = { id: 'av1', value: 'XXL' } as never;
      prisma.attributeValue.update.mockResolvedValue(updated);

      const result = await service.updateValue('av1', { value: 'XXL' });
      expect(result).toBe(updated);
    });
  });

  describe('deleteValue', () => {
    it('should delete an attribute value', async () => {
      const deleted = { id: 'av1' } as never;
      prisma.attributeValue.delete.mockResolvedValue(deleted);

      const result = await service.deleteValue('av1');
      expect(result).toBe(deleted);
    });
  });

  describe('findValueById', () => {
    it('should return null when value not found', async () => {
      prisma.attributeValue.findUnique.mockResolvedValue(null);

      const result = await service.findValueById('missing');
      expect(result).toBeNull();
    });

    it('should return the attribute value when found', async () => {
      const val = { id: 'av1', value: 'M' } as never;
      prisma.attributeValue.findUnique.mockResolvedValue(val);

      const result = await service.findValueById('av1');
      expect(result).toBe(val);
    });
  });
});
