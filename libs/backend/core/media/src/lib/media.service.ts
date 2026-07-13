import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import sharp from 'sharp';
import 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

  async onModuleInit() {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    } catch (e) {
      this.logger.error(`Failed to create upload directory: ${String(e)}`);
    }
  }

  async processAndSaveImage(
    file: Express.Multer.File,
  ): Promise<Record<string, string>> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File is not an image');
    }

    const filenameBase = crypto.randomUUID();
    const urls: Record<string, string> = {};

    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      if (metadata.width && metadata.width > 4096) {
        throw new BadRequestException(
          `Image width of ${metadata.width}px exceeds maximum allowed size of 4096px`,
        );
      }
      if (metadata.height && metadata.height > 4096) {
        throw new BadRequestException(
          `Image height of ${metadata.height}px exceeds maximum allowed size of 4096px`,
        );
      }

      // Save original as WebP
      const originalPath = path.join(
        this.UPLOAD_DIR,
        `${filenameBase}-original.webp`,
      );
      await image.clone().webp({ quality: 80 }).toFile(originalPath);
      urls['original'] = `/uploads/${filenameBase}-original.webp`;

      // Save medium as WebP (e.g. 600px width)
      const mediumPath = path.join(
        this.UPLOAD_DIR,
        `${filenameBase}-medium.webp`,
      );
      await image
        .clone()
        .resize({ width: 600 })
        .webp({ quality: 80 })
        .toFile(mediumPath);
      urls['medium'] = `/uploads/${filenameBase}-medium.webp`;

      // Save thumb as WebP (e.g. 150px width)
      const thumbPath = path.join(
        this.UPLOAD_DIR,
        `${filenameBase}-thumb.webp`,
      );
      await image
        .clone()
        .resize({ width: 150 })
        .webp({ quality: 80 })
        .toFile(thumbPath);
      urls['thumb'] = `/uploads/${filenameBase}-thumb.webp`;

      return urls;
    } catch (e) {
      this.logger.error(`Image processing failed: ${String(e)}`);
      throw new BadRequestException('Could not process image');
    }
  }
}
