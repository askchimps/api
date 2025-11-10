import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileValidationService } from './file-validation.service';
import { MediaProcessingService } from './media-processing.service';
import { WhatsAppCompatibilityService } from './whatsapp-compatibility.service';
import { CloudflareR2Provider } from './providers/cloudflare-r2.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [
    UploadService, 
    FileValidationService, 
    MediaProcessingService,
    WhatsAppCompatibilityService,
    CloudflareR2Provider,
    LocalStorageProvider,
  ],
  exports: [
    UploadService, 
    FileValidationService, 
    MediaProcessingService,
    WhatsAppCompatibilityService,
  ],
})
export class UploadModule {}