export interface StorageProvider {
  upload(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder?: string
  ): Promise<StorageUploadResult>;
  
  delete(fileUrl: string): Promise<void>;
  
  generateSignedUrl(fileUrl: string, expiresIn?: number): Promise<string>;
  
  getPublicUrl(key: string): string;
}

export interface StorageUploadResult {
  fileUrl: string;
  key: string;
  size: number;
}