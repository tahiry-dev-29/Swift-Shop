import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductBulkService } from './product-bulk.service';
import 'multer';

@Controller('products/bulk')
export class ProductBulkController {
  constructor(private readonly bulkService: ProductBulkService) {}

  @Get('export')
  async export() {
    const buffer = await this.bulkService.exportProducts();

    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="products.xlsx"',
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.match(/\.(xlsx|csv)$/)) {
      throw new BadRequestException('Only XLSX or CSV files are allowed');
    }

    return this.bulkService.importProducts(file.buffer);
  }
}
