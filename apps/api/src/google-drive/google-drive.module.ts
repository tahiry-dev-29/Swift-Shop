import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveService } from './google-drive.service';
import googleDriveConfig from '../config/google-drive.config';

/**
 * Module to configure and export GoogleDriveService.
 */
@Module({
  imports: [ConfigModule.forFeature(googleDriveConfig)],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
