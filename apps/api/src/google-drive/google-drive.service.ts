import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth, drive, drive_v3 } from '@googleapis/drive';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service to interact with Google Drive API.
 */
@Injectable()
export class GoogleDriveService {
  private readonly driveClient: drive_v3.Drive;
  private readonly mediaFolderId: string;
  private readonly productImageFolderId: string;
  private readonly bulkImportFolderId: string;

  constructor(private readonly configService: ConfigService) {
    const mediaFolderId = this.configService.get<string>(
      'googleDrive.mediaFolderId',
    );
    const productImageFolderId = this.configService.get<string>(
      'googleDrive.productImageFolderId',
    );
    const bulkImportFolderId = this.configService.get<string>(
      'googleDrive.bulkImportFolderId',
    );

    if (!mediaFolderId || !productImageFolderId || !bulkImportFolderId) {
      throw new InternalServerErrorException(
        'Google Drive Folder IDs are required. Check environment variables.',
      );
    }

    this.mediaFolderId = mediaFolderId;
    this.productImageFolderId = productImageFolderId;
    this.bulkImportFolderId = bulkImportFolderId;

    // Elite Render strategy: env var → /etc/secrets (Render) → project-relative fallback
    const keyFile = this.resolveCredentialsPath();

    this.driveClient = drive({
      version: 'v3',
      auth: new auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      }),
    });
  }

  /**
   * Resolves the credentials file path in a environment-agnostic way.
   * Priority: GOOGLE_APPLICATION_CREDENTIALS → /etc/secrets → process.cwd()
   */
  private resolveCredentialsPath(): string {
    const fromEnv = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
    if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

    const renderSecrets = '/etc/secrets/google-credentials.json';
    if (fs.existsSync(renderSecrets)) return renderSecrets;

    return path.join(process.cwd(), 'apps/api/config/google-credentials.json');
  }

  /**
   * Uploads an image to the configured Google Drive folder.
   * @param file The file uploaded via Multer
   * @param folderType The target folder type ('media' or 'productImage')
   * @returns The uploaded file's ID on Google Drive
   */
  async uploadImage(
    file: Express.Multer.File,
    folderType: 'media' | 'productImage' = 'media',
  ): Promise<string> {
    try {
      const targetFolderId =
        folderType === 'productImage'
          ? this.productImageFolderId
          : this.mediaFolderId;

      const fileMetadata = {
        name: `${Date.now()}-${file.originalname}`,
        parents: [targetFolderId],
      };

      const media = {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer),
      };

      const response = await this.driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      const responseData = response.data;
      if (!responseData || !responseData.id) {
        throw new InternalServerErrorException(
          'Google Drive response did not return a file ID.',
        );
      }

      const fileId = responseData.id;

      // Make the file publicly accessible (anyone can read)
      await this.driveClient.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return fileId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Erreur lors de l'upload Google Drive: ${message}`,
      );
    }
  }
}
