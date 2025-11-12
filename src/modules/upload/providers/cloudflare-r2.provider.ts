import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider, StorageUploadResult } from './storage-provider.interface';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class CloudflareR2Provider implements StorageProvider {
  private readonly logger = new Logger(CloudflareR2Provider.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrlBase: string;

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Cloudflare R2 provider');
    
    // Validate required environment variables
    const accessKeyId = this.configService.get('CLOUDFLARE_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('CLOUDFLARE_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get('CLOUDFLARE_R2_ENDPOINT');
    const bucketName = this.configService.get('CLOUDFLARE_R2_BUCKET_NAME');
    const publicUrlBase = this.configService.get('CLOUDFLARE_PUBLIC_URL');

    this.logger.debug(`R2 Configuration - Endpoint: ${endpoint}, Bucket: ${bucketName}, PublicURL: ${publicUrlBase}`);

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName || !publicUrlBase) {
      this.logger.error('Missing required Cloudflare R2 configuration');
      throw new Error('Missing required Cloudflare R2 configuration. Please check your environment variables.');
    }

    // Initialize Cloudflare R2 client using S3-compatible API
    this.s3Client = new S3Client({
      region: 'auto', // Cloudflare R2 uses 'auto' region
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });

    this.bucketName = bucketName;
    this.publicUrlBase = publicUrlBase;
    
    this.logger.log('Cloudflare R2 provider initialized successfully');
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder = 'uploads'
  ): Promise<StorageUploadResult> {
    const uploadId = crypto.randomUUID();
    this.logger.log(`[${uploadId}] Starting R2 upload - filename: ${filename}, size: ${buffer.length} bytes, folder: ${folder}`);
    
    try {
      // Generate unique filename to prevent conflicts
      const fileExtension = path.extname(filename);
      const baseName = path.basename(filename, fileExtension);
      const uniqueId = crypto.randomUUID();
      const uniqueFilename = `${baseName}-${uniqueId}${fileExtension}`;
      
      // Create S3 key with folder structure
      const key = `${folder}/${uniqueFilename}`;
      this.logger.debug(`[${uploadId}] Generated R2 key: ${key}`);

      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        // Set cache control for better performance
        CacheControl: 'public, max-age=31536000', // 1 year
        // Set metadata for tracking
        Metadata: {
          'original-name': filename,
          'upload-date': new Date().toISOString(),
        },
      });

      this.logger.debug(`[${uploadId}] Executing R2 PutObject command`);
      await this.s3Client.send(uploadCommand);
      this.logger.debug(`[${uploadId}] R2 upload completed successfully`);
      
      // Construct the public URL
      const fileUrl = `${this.publicUrlBase}/${key}`;
      this.logger.log(`[${uploadId}] File uploaded to R2 successfully: ${filename} -> ${fileUrl}`);

      return {
        fileUrl,
        size: buffer.length,
        key: key,
      };
    } catch (error) {
      this.logger.error(`[${uploadId}] R2 upload failed for ${filename}:`, error?.stack || error);
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  }

  async delete(fileUrl: string): Promise<void> {
    this.logger.log(`Attempting to delete file from R2: ${fileUrl}`);
    
    // Extract key from public URL
    const key = this.extractKeyFromUrl(fileUrl);
    
    if (!key) {
      this.logger.error(`Invalid file URL format for deletion: ${fileUrl}`);
      throw new Error('Invalid file URL format');
    }

    this.logger.debug(`Extracted R2 key for deletion: ${key}`);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      this.logger.debug(`Executing R2 DeleteObject command for key: ${key}`);
      await this.s3Client.send(deleteCommand);
      this.logger.log(`File deleted from R2 successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from R2 (${key}):`, error?.stack || error);
      throw new Error(`Failed to delete file from Cloudflare R2: ${error.message}`);
    }
  }

  async generateSignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    // For Cloudflare R2 with public URLs, we might not need signed URLs
    // But if private access is needed, implement getSignedUrl here
    return fileUrl;
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrlBase}/${key}`;
  }

  private extractKeyFromUrl(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      // Remove leading slash
      return url.pathname.substring(1);
    } catch (error) {
      return null;
    }
  }
}