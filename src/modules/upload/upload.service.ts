import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidationService } from './file-validation.service';
import { MediaProcessingService } from './media-processing.service';
import { FileUploadResult } from './dto';
import { StorageProvider } from './providers/storage-provider.interface';
import { CloudflareR2Provider } from './providers/cloudflare-r2.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import * as path from 'path';
import * as crypto from 'crypto';

export interface MultipartFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  encoding: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly storageProvider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileValidationService: FileValidationService,
    private readonly mediaProcessingService: MediaProcessingService,
  ) {
    // Initialize storage provider based on configuration
    const useCloudflare = this.configService.get('USE_CLOUDFLARE_STORAGE') === 'true';
    
    this.logger.log(`Initializing storage provider: ${useCloudflare ? 'Cloudflare R2' : 'Local Storage'}`);
    
    if (useCloudflare) {
      this.storageProvider = new CloudflareR2Provider(this.configService);
    } else {
      this.storageProvider = new LocalStorageProvider();
    }
    
    this.logger.log('Storage provider initialized successfully');
  }

  async uploadFile(
    file: MultipartFile,
    category: 'image' | 'video' | 'audio' | 'document',
    subfolder?: string
  ): Promise<FileUploadResult> {
    const requestId = crypto.randomUUID();
    
    this.logger.log(`[${requestId}] Starting file upload - filename: ${file.filename}, size: ${file.size} bytes, mimetype: ${file.mimetype}, category: ${category}`);
    
    try {
      // Extract metadata first for validation
      this.logger.debug(`[${requestId}] Extracting metadata for file: ${file.filename}`);
      const metadata = await this.extractMetadata(file.buffer, file.mimetype, file.filename);
      this.logger.debug(`[${requestId}] Metadata extracted successfully: ${JSON.stringify(metadata)}`);

      // Validate file with metadata
      this.logger.debug(`[${requestId}] Validating file: ${file.filename}`);
      const validation = this.fileValidationService.validateFile(
        file.buffer,
        file.filename,
        file.mimetype,
        category,
        metadata
      );

      if (!validation.isValid) {
        this.logger.warn(`[${requestId}] File validation failed for ${file.filename}: ${validation.error}`);
        throw new BadRequestException(validation.error);
      }
      
      this.logger.debug(`[${requestId}] File validation passed for ${file.filename}`);

      // Determine folder structure
      const folder = subfolder ? `${category}/${subfolder}` : category;
      this.logger.debug(`[${requestId}] Upload folder: ${folder}`);
      
      // Upload using storage provider
      this.logger.debug(`[${requestId}] Starting storage upload for ${file.filename}`);
      const uploadResult = await this.storageProvider.upload(
        file.buffer,
        file.filename,
        file.mimetype,
        folder
      );
      this.logger.debug(`[${requestId}] Storage upload completed for ${file.filename}. URL: ${uploadResult.fileUrl}`);

      const result = {
        file_url: uploadResult.fileUrl,
        file_name: validation.sanitizedFileName || file.filename,
        file_size: uploadResult.size,
        file_type: file.mimetype,
        whatsapp_compatible: validation.whatsappCompatible,
        whatsapp_warnings: validation.whatsappWarnings,
        ...metadata
      };
      
      this.logger.log(`[${requestId}] File upload completed successfully - ${file.filename} -> ${uploadResult.fileUrl}`);
      return result;
    } catch (error) {
      this.logger.error(`[${requestId}] File upload failed for ${file.filename}:`, error?.stack || error);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: MultipartFile[],
    category: 'image' | 'video' | 'audio' | 'document',
    subfolder?: string
  ): Promise<FileUploadResult[]> {
    const batchId = crypto.randomUUID();
    const results: FileUploadResult[] = [];
    
    this.logger.log(`[${batchId}] Starting batch upload - ${files.length} files, category: ${category}`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        this.logger.debug(`[${batchId}] Processing file ${i + 1}/${files.length}: ${file.filename}`);
        const result = await this.uploadFile(file, category, subfolder);
        results.push(result);
        this.logger.debug(`[${batchId}] File ${i + 1}/${files.length} uploaded successfully: ${file.filename}`);
      } catch (error) {
        this.logger.error(`[${batchId}] Failed to upload file ${i + 1}/${files.length} (${file.filename}):`, error?.stack || error);
        throw error; // Re-throw to handle in controller
      }
    }
    
    this.logger.log(`[${batchId}] Batch upload completed - ${results.length}/${files.length} files uploaded successfully`);
    return results;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    this.logger.log(`Attempting to delete file: ${fileUrl}`);
    try {
      await this.storageProvider.delete(fileUrl);
      this.logger.log(`File deleted successfully: ${fileUrl}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${fileUrl}:`, error?.stack || error);
      // Don't throw error - file might already be deleted
    }
  }

  async generateSignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    this.logger.debug(`Generating signed URL for: ${fileUrl}, expiresIn: ${expiresIn}s`);
    try {
      const signedUrl = await this.storageProvider.generateSignedUrl(fileUrl, expiresIn);
      this.logger.debug(`Signed URL generated successfully for: ${fileUrl}`);
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${fileUrl}:`, error?.stack || error);
      throw error;
    }
  }

  private async extractMetadata(buffer: Buffer, mimeType: string, filename: string): Promise<Partial<FileUploadResult>> {
    this.logger.debug(`Extracting metadata for file: ${filename}, mimeType: ${mimeType}, size: ${buffer.length} bytes`);
    try {
      const metadata = await this.mediaProcessingService.extractFileMetadata(
        buffer,
        mimeType,
        filename
      );
      this.logger.debug(`Metadata extraction completed for: ${filename}`);
      return metadata;
    } catch (error) {
      this.logger.warn(`Media processing failed for ${filename}:`, error?.stack || error);
      return {};
    }
  }
}