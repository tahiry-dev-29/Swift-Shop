import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Workbook } from 'exceljs';

type OrderExportFormat = 'csv' | 'xlsx';

type OrderExportRow = {
  reference: string;
  state: string;
  items: number;
  totalHT: number;
  totalTax: number;
  totalTTC: number;
  dateAdd: string;
};

/**
 * Builds customer order exports for GraphQL download payloads.
 */
@Injectable()
export class OrderExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportOrders(customerId: string, format: OrderExportFormat = 'csv') {
    if (!['csv', 'xlsx'].includes(format)) {
      throw new BadRequestException('Unsupported export format');
    }

    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { state: true, items: true },
      orderBy: { dateAdd: 'desc' },
    });
    const rows = orders.map((order) => ({
      reference: order.reference,
      state: order.state.name,
      items: order.items.length,
      totalHT: Number(order.totalHT),
      totalTax: Number(order.totalTax),
      totalTTC: Number(order.totalTTC),
      dateAdd: order.dateAdd.toISOString(),
    }));

    return format === 'xlsx' ? this.toXlsx(rows) : this.toCsv(rows);
  }

  private async toXlsx(rows: OrderExportRow[]) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Orders');
    worksheet.columns = [
      { header: 'Reference', key: 'reference' },
      { header: 'State', key: 'state' },
      { header: 'Items', key: 'items' },
      { header: 'Total HT', key: 'totalHT' },
      { header: 'Tax', key: 'totalTax' },
      { header: 'Total TTC', key: 'totalTTC' },
      { header: 'Created at', key: 'dateAdd' },
    ];
    worksheet.addRows(rows);
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      format: 'xlsx',
      filename: 'orders.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: Buffer.from(buffer).toString('base64'),
    };
  }

  private toCsv(rows: OrderExportRow[]) {
    const csv = [
      'reference,state,items,totalHT,totalTax,totalTTC,dateAdd',
      ...rows.map((row) =>
        [
          row.reference,
          row.state,
          row.items,
          row.totalHT,
          row.totalTax,
          row.totalTTC,
          row.dateAdd,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    return {
      format: 'csv',
      filename: 'orders.csv',
      mimeType: 'text/csv',
      base64: Buffer.from(csv).toString('base64'),
    };
  }
}
