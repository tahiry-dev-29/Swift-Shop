import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

/**
 * Module for managing uploads.
 */
@Module({
  imports: [GoogleDriveModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
