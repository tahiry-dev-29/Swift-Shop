import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import 'multer';

/**
 * Controller to handle image uploads and route them to Google Drive.
 */
@Controller('uploads')
export class UploadsController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  /**
   * Upload a general media image to Google Drive.
   * @param file The file uploaded via Multer
   * @returns An object containing the success message and Google Drive file ID
   */
  @Post('media')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadMedia(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }

    const fileId = await this.googleDriveService.uploadImage(file, 'media');

    return {
      message: 'Média uploadé avec succès sur Google Drive',
      driveFileId: fileId,
    };
  }

  /**
   * Upload a product image to Google Drive.
   * @param file The file uploaded via Multer
   * @returns An object containing the success message and Google Drive file ID
   */
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }

    const fileId = await this.googleDriveService.uploadImage(
      file,
      'productImage',
    );

    return {
      message: 'Image produit uploadée avec succès sur Google Drive',
      driveFileId: fileId,
    };
  }
}
