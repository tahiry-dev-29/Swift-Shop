import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

/**
 * Generates invoice records and writes their PDF files.
 */
@Injectable()
export class OrderInvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePDF(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    let invoice = await this.prisma.invoice.findUnique({ where: { orderId } });
    const invoiceNumber = invoice?.invoiceNumber ?? `INV-${order.reference}`;
    const pdfStorageRef = `uploads/invoices/${invoiceNumber}.pdf`;

    await this.writeInvoicePdf(pdfStorageRef, [
      invoiceNumber,
      `Order ${order.reference}`,
      `Customer ${order.customer.email}`,
      `Total TTC ${Number(order.totalTTC).toFixed(2)}`,
      ...order.items.map(
        (item) =>
          `${item.quantity} x ${item.productName} ${Number(item.totalTTC).toFixed(2)}`,
      ),
    ]);

    invoice = invoice
      ? await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { pdfStorageRef },
        })
      : await this.prisma.invoice.create({
          data: { orderId, invoiceNumber, pdfStorageRef },
        });

    return invoice;
  }

  private async writeInvoicePdf(storageRef: string, lines: string[]) {
    const absolutePath = join(process.cwd(), 'public', storageRef);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, this.buildPdf(lines));
  }

  private buildPdf(lines: string[]) {
    const content = this.invoiceContent(lines);
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      `4 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${object}\n`;
    }
    return this.withXref(pdf, offsets, objects.length);
  }

  private withXref(pdf: string, offsets: number[], objectCount: number) {
    const xrefOffset = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objectCount + 1}\n`;
    pdf += '0000000000 65535 f \n';
    pdf += offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
      .join('');
    pdf += `trailer << /Size ${objectCount + 1} /Root 1 0 R >>\n`;
    return `${pdf}startxref\n${xrefOffset}\n%%EOF`;
  }

  private invoiceContent(lines: string[]) {
    return lines
      .map((line, index) => {
        const escaped = line.replace(/\\/g, '\\\\').replace(/[()]/g, '\\$&');
        return `BT /F1 12 Tf 50 ${780 - index * 24} Td (${escaped}) Tj ET`;
      })
      .join('\n');
  }
}
