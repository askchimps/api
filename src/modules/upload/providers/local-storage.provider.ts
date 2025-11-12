import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, StorageUploadResult } from './storage-provider.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder = 'uploads'
  ): Promise<StorageUploadResult> {
    // Generate unique filename
    const fileExtension = path.extname(filename);
    const baseName = path.basename(filename, fileExtension);
    const uniqueId = crypto.randomUUID();
    const uniqueFilename = `${baseName}-${uniqueId}${fileExtension}`;
    
    // Create folder structure
    const folderPath = path.join(this.uploadDir, folder);
    await fs.mkdir(folderPath, { recursive: true });
    
    // Full file path
    const filePath = path.join(folderPath, uniqueFilename);
    
    // Write file
    await fs.writeFile(filePath, buffer);
    
    // Generate public URL
    const relativePath = path.posix.join(folder, uniqueFilename);
    const publicUrl = `${this.baseUrl}/uploads/${relativePath}`;
    
    return {
      fileUrl: publicUrl,
      key: relativePath,
      size: buffer.length,
    };
  }

  async delete(fileUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(fileUrl);
    if (!key) {
      throw new Error('Invalid file URL format');
    }
    
    const filePath = path.join(this.uploadDir, key);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete local file: ${error.message}`);
      }
    }
  }

  async generateSignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    // Local storage doesn't need signed URLs - just return the public URL
    return fileUrl;
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  private extractKeyFromUrl(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(/\/uploads\/(.+)$/);
      return pathMatch ? pathMatch[1] : null;
    } catch (error) {
      return null;
    }
  }
}