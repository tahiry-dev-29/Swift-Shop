import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { StockAlertService } from './stock-alert.service';
import { StockAlertRepository } from './stock-alert.repository';
import { StockAlertFormatter } from './stock-alert.formatter';

function makeRepository(): Mocked<StockAlertRepository> {
  return {
    findLowStockItems: vi.fn(),
  } as unknown as Mocked<StockAlertRepository>;
}

function makeFormatter(): Mocked<StockAlertFormatter> {
  return {
    formatItemName: vi.fn(),
  } as unknown as Mocked<StockAlertFormatter>;
}

describe('StockAlertService', () => {
  let service: StockAlertService;
  let repository: Mocked<StockAlertRepository>;
  let formatter: Mocked<StockAlertFormatter>;

  beforeEach(() => {
    repository = makeRepository();
    formatter = makeFormatter();
    service = new StockAlertService(repository, formatter);
  });

  // ─── checkLowStock ────────────────────────────────────────────────────────

  describe('checkLowStock', () => {
    it('should not call formatter when no low stock items are found', async () => {
      repository.findLowStockItems.mockResolvedValue([]);

      await service.checkLowStock();

      expect(repository.findLowStockItems).toHaveBeenCalled();
      expect(formatter.formatItemName).not.toHaveBeenCalled();
    });

    it('should call formatter for each low stock item found', async () => {
      const lowStocks = [
        {
          id: 's1',
          productName: 'Widget',
          combinationRef: null,
          quantity: 2,
          minQuantity: 5,
        },
        {
          id: 's2',
          productName: 'Gadget',
          combinationRef: 'RED',
          quantity: 0,
          minQuantity: 3,
        },
      ];
      repository.findLowStockItems.mockResolvedValue(lowStocks as never);
      formatter.formatItemName.mockReturnValue('Widget (s1)');

      await service.checkLowStock();

      expect(formatter.formatItemName).toHaveBeenCalledTimes(2);
      expect(formatter.formatItemName).toHaveBeenCalledWith(lowStocks[0]);
      expect(formatter.formatItemName).toHaveBeenCalledWith(lowStocks[1]);
    });

    it('should not throw when repository throws (fault-tolerant inspection)', async () => {
      repository.findLowStockItems.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.checkLowStock()).resolves.not.toThrow();
    });

    it('should process all items even if many are in low stock', async () => {
      const many = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        productName: `Product ${i}`,
        combinationRef: null,
        quantity: 0,
        minQuantity: 5,
      }));
      repository.findLowStockItems.mockResolvedValue(many as never);
      formatter.formatItemName.mockImplementation(
        (s) => s.productName as string,
      );

      await service.checkLowStock();

      expect(formatter.formatItemName).toHaveBeenCalledTimes(20);
    });
  });
});
