import { registerAs } from '@nestjs/config';

/**
 * Google Drive configuration registration.
 */
export default registerAs('googleDrive', () => ({
  mediaFolderId: process.env['GOOGLE_DRIVE_MEDIA_FOLDER_ID'],
  productImageFolderId: process.env['GOOGLE_DRIVE_PRODUCT_IMAGE_FOLDER_ID'],
  bulkImportFolderId: process.env['GOOGLE_DRIVE_BULK_IMPORT_FOLDER_ID'],
}));
