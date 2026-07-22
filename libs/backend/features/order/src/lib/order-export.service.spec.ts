import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { OrderExportService } from './order-export.service';
import { PrismaService } from '@swift-shop/data-access-prisma';

describe('OrderExportService', () => {
  let service: OrderExportService;
  let prisma: Mocked<PrismaService>;

  const mockOrder = {
    reference: 'ORD-123',
    state: { name: 'Processing' },
    items: [{ id: 'item-1' }, { id: 'item-2' }],
    totalHT: 100,
    totalTax: 20,
    totalTTC: 120,
    dateAdd: new Date('2026-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      order: {
        findMany: vi.fn(),
      },
    } as any;

    service = new OrderExportService(prisma);
  });

  it('should export customer orders to CSV format with correct header and column mapping', async () => {
    prisma.order.findMany.mockResolvedValue([mockOrder] as any);

    const result = await service.exportOrders('cust-1', 'csv');
    expect(result.format).toBe('csv');
    expect(result.filename).toBe('orders.csv');
    expect(result.mimeType).toBe('text/csv');

    const decoded = Buffer.from(result.base64, 'base64').toString('utf8');
    expect(decoded).toContain(
      'reference,state,items,totalHT,totalTax,totalTTC,dateAdd',
    );
    expect(decoded).toContain('"ORD-123","Processing","2","100","20","120"');
  });

  it('should export customer orders to XLSX format', async () => {
    prisma.order.findMany.mockResolvedValue([mockOrder] as any);

    const result = await service.exportOrders('cust-1', 'xlsx');
    expect(result.format).toBe('xlsx');
    expect(result.filename).toBe('orders.xlsx');
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.base64).toBeDefined();
  });

  it('should throw BadRequestException for unsupported export format', async () => {
    await expect(
      service.exportOrders('cust-1', 'invalid_format' as any),
    ).rejects.toThrow(BadRequestException);
  });
});
