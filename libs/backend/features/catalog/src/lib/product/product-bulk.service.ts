import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import * as ExcelJS from 'exceljs';
import { ProductSearchService } from './product-search.service';

export interface BulkProductRow {
  id?: string;
  reference: string;
  name: string;
  slug: string;
  price: number;
  active: boolean;
  categoryId: string | null;
}

@Injectable()
export class ProductBulkService {
  private readonly logger = new Logger(ProductBulkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: ProductSearchService,
  ) {}

  async exportProducts(): Promise<Uint8Array> {
    const products = await this.prisma.product.findMany({
      include: { category: true },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Reference', key: 'reference', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 30 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Active', key: 'active', width: 10 },
      { header: 'Category ID', key: 'categoryId', width: 30 },
    ];

    products.forEach((p) => {
      worksheet.addRow({
        id: p.id,
        reference: p.reference,
        name: p.name,
        slug: p.slug,
        price: p.price,
        active: p.active,
        categoryId: p.categoryId,
      });
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Uint8Array;
  }

  async importProducts(buffer: Buffer | ArrayBuffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as ExcelJS.Buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('No worksheet found');
    }

    const rows: BulkProductRow[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const reference = row.getCell(2).value?.toString();
      const name = row.getCell(3).value?.toString();
      const slug = row.getCell(4).value?.toString();

      if (!reference || !name || !slug) {
        throw new BadRequestException(
          `Row ${rowNumber} is missing required fields (reference, name, slug)`,
        );
      }

      rows.push({
        id: row.getCell(1).value?.toString(),
        reference,
        name,
        slug,
        price: parseFloat(row.getCell(5).value?.toString() || '0'),
        active: row.getCell(6).value?.toString() === 'true',
        categoryId: row.getCell(7).value?.toString() || null,
      });
    });

    let imported = 0;
    const errors: string[] = [];
    for (const data of rows) {
      try {
        const product = await this.prisma.product.upsert({
          where: { id: data.id || '' },
          update: {
            name: data.name,
            reference: data.reference,
            price: data.price,
            active: data.active,
            categoryId: data.categoryId,
          },
          create: {
            name: data.name,
            slug: data.slug,
            reference: data.reference,
            price: data.price,
            active: data.active,
            categoryId: data.categoryId,
          },
        });

        await this.searchService.syncProduct(product);
        imported++;
      } catch (error) {
        errors.push(
          `Row ${data.reference || 'Unknown'}: ${(error as Error).message}`,
        );
      }
    }

    if (errors.length > 0) {
      this.logger.error(
        `Failed to import ${errors.length} products. Master Summary:\n${errors.join('\n')}`,
      );
    }

    return { imported, total: rows.length };
  }
}
