import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductBulkService } from './product-bulk.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { ProductSearchService } from './product-search.service';
import * as ExcelJS from 'exceljs';

describe('ProductBulkService', () => {
  let service: ProductBulkService;
  let prisma: jest.Mocked<PrismaService>;
  let searchService: jest.Mocked<ProductSearchService>;

  beforeEach(async () => {
    const mockPrisma = {
      product: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };
    const mockSearchSvc = {
      syncProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductBulkService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProductSearchService, useValue: mockSearchSvc },
      ],
    }).compile();

    service = module.get<ProductBulkService>(ProductBulkService);
    prisma = module.get(PrismaService);
    searchService = module.get(ProductSearchService);
  });

  describe('exportProducts', () => {
    it('should generate an XLSX buffer containing product data', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prod-1',
          reference: 'REF1',
          name: 'Product 1',
          slug: 'product-1',
          price: 100,
          active: true,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Cat 1' },
        },
      ]);

      const buffer = await service.exportProducts();
      expect(buffer).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('importProducts', () => {
    it('should parse valid excel buffer and upsert products into database', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');
      worksheet.addRow([
        'ID',
        'Reference',
        'Name',
        'Slug',
        'Price',
        'Active',
        'Category ID',
      ]);
      worksheet.addRow([
        'prod-1',
        'REF1',
        'Product 1',
        'product-1',
        '100',
        'true',
        'cat-1',
      ]);

      const buffer = await workbook.xlsx.writeBuffer();

      (prisma.product.upsert as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
      } as any);

      const result = await service.importProducts(buffer as Buffer);
      expect(result.imported).toBe(1);
      expect(result.total).toBe(1);
      expect(prisma.product.upsert).toHaveBeenCalled();
      expect(searchService.syncProduct).toHaveBeenCalled();
    });

    it('should throw BadRequestException if row is missing required fields', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');
      worksheet.addRow([
        'ID',
        'Reference',
        'Name',
        'Slug',
        'Price',
        'Active',
        'Category ID',
      ]);
      worksheet.addRow(['prod-1', '', 'Product 1', '', '100', 'true', 'cat-1']); // missing reference & slug

      const buffer = await workbook.xlsx.writeBuffer();

      await expect(service.importProducts(buffer as Buffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
