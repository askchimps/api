import { Injectable } from '@nestjs/common';

export interface WhatsAppFileValidation {
  isValid: boolean;
  error?: string;
  needsConversion?: boolean;
  recommendedFormat?: string;
}

@Injectable()
export class WhatsAppCompatibilityService {
  private readonly whatsAppLimits = {
    image: {
      maxSize: 16 * 1024 * 1024, // 16MB
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxDimension: 4096,
    },
    video: {
      maxSize: 16 * 1024 * 1024, // 16MB
      supportedFormats: ['video/mp4', 'video/3gpp'],
      maxDuration: 60, // 60 seconds
      recommendedCodec: 'H.264',
    },
    audio: {
      maxSize: 16 * 1024 * 1024, // 16MB
      supportedFormats: [
        'audio/aac', 
        'audio/mp4', 
        'audio/mpeg', 
        'audio/amr', 
        'audio/ogg; codecs=opus'
      ],
      maxDuration: 60, // 60 seconds
    },
    document: {
      maxSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
    },
    sticker: {
      maxSize: 100 * 1024, // 100KB
      supportedFormats: ['image/webp'],
      requiredDimensions: { width: 512, height: 512 },
      animated: false, // Static stickers only
    }
  };

  validateForWhatsApp(
    mimetype: string,
    fileSize: number,
    category: 'image' | 'video' | 'audio' | 'document' | 'sticker',
    metadata?: any
  ): WhatsAppFileValidation {
    const limits = this.whatsAppLimits[category];
    
    if (!limits) {
      return {
        isValid: false,
        error: `Unsupported category: ${category}`,
      };
    }

    // Check file size
    if (fileSize > limits.maxSize) {
      return {
        isValid: false,
        error: `File size ${this.formatFileSize(fileSize)} exceeds WhatsApp limit of ${this.formatFileSize(limits.maxSize)} for ${category} files`,
      };
    }

    // Check supported formats
    if (!limits.supportedFormats.includes(mimetype)) {
      const recommendedFormat = this.getRecommendedFormat(category, mimetype);
      return {
        isValid: false,
        error: `Format ${mimetype} is not supported by WhatsApp for ${category} files`,
        needsConversion: true,
        recommendedFormat,
      };
    }

    // Category-specific validations
    switch (category) {
      case 'image':
        return this.validateImage(metadata);
      case 'video':
        return this.validateVideo(metadata);
      case 'audio':
        return this.validateAudio(metadata);
      case 'sticker':
        return this.validateSticker(metadata);
      case 'document':
        return { isValid: true };
      default:
        return { isValid: true };
    }
  }

  private validateImage(metadata?: any): WhatsAppFileValidation {
    if (!metadata || !metadata.width || !metadata.height) {
      return { isValid: true }; // Can't validate without metadata
    }

    const maxDimension = this.whatsAppLimits.image.maxDimension;
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      return {
        isValid: false,
        error: `Image dimensions ${metadata.width}x${metadata.height} exceed WhatsApp limit of ${maxDimension}x${maxDimension}`,
        needsConversion: true,
        recommendedFormat: 'Resize to fit within 4096x4096 pixels',
      };
    }

    return { isValid: true };
  }

  private validateVideo(metadata?: any): WhatsAppFileValidation {
    if (!metadata) {
      return { isValid: true }; // Can't validate without metadata
    }

    if (metadata.duration && metadata.duration > this.whatsAppLimits.video.maxDuration) {
      return {
        isValid: false,
        error: `Video duration ${metadata.duration}s exceeds WhatsApp limit of ${this.whatsAppLimits.video.maxDuration}s`,
        needsConversion: true,
        recommendedFormat: 'Trim video to under 60 seconds',
      };
    }

    return { isValid: true };
  }

  private validateAudio(metadata?: any): WhatsAppFileValidation {
    if (!metadata) {
      return { isValid: true }; // Can't validate without metadata
    }

    if (metadata.duration && metadata.duration > this.whatsAppLimits.audio.maxDuration) {
      return {
        isValid: false,
        error: `Audio duration ${metadata.duration}s exceeds WhatsApp limit of ${this.whatsAppLimits.audio.maxDuration}s`,
        needsConversion: true,
        recommendedFormat: 'Trim audio to under 60 seconds',
      };
    }

    return { isValid: true };
  }

  private validateSticker(metadata?: any): WhatsAppFileValidation {
    const required = this.whatsAppLimits.sticker.requiredDimensions;
    
    if (!metadata || !metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: 'Cannot validate sticker without image dimensions',
      };
    }

    if (metadata.width !== required.width || metadata.height !== required.height) {
      return {
        isValid: false,
        error: `Sticker must be exactly ${required.width}x${required.height} pixels, got ${metadata.width}x${metadata.height}`,
        needsConversion: true,
        recommendedFormat: `Resize to ${required.width}x${required.height} pixels`,
      };
    }

    return { isValid: true };
  }

  private getRecommendedFormat(category: string, currentMimetype: string): string {
    switch (category) {
      case 'image':
        if (currentMimetype.includes('gif')) {
          return 'Convert GIF to MP4 video for WhatsApp';
        }
        return 'image/jpeg';
      case 'video':
        return 'video/mp4 with H.264 codec';
      case 'audio':
        return 'audio/aac or audio/mp4';
      case 'document':
        return 'application/pdf';
      case 'sticker':
        return 'image/webp (512x512 pixels)';
      default:
        return 'Unknown';
    }
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Get WhatsApp-specific metadata for frontend
  getWhatsAppLimits() {
    return {
      maxFileSizes: {
        image: this.formatFileSize(this.whatsAppLimits.image.maxSize),
        video: this.formatFileSize(this.whatsAppLimits.video.maxSize),
        audio: this.formatFileSize(this.whatsAppLimits.audio.maxSize),
        document: this.formatFileSize(this.whatsAppLimits.document.maxSize),
        sticker: this.formatFileSize(this.whatsAppLimits.sticker.maxSize),
      },
      supportedFormats: {
        image: this.whatsAppLimits.image.supportedFormats,
        video: this.whatsAppLimits.video.supportedFormats,
        audio: this.whatsAppLimits.audio.supportedFormats,
        document: this.whatsAppLimits.document.supportedFormats,
        sticker: this.whatsAppLimits.sticker.supportedFormats,
      },
      recommendations: {
        image: 'Use JPEG or PNG format, max 4096x4096 pixels',
        video: 'Use MP4 format with H.264 codec, max 60 seconds',
        audio: 'Use AAC or MP4 format, max 60 seconds',
        document: 'PDF, DOC, XLS, PPT formats supported',
        sticker: 'Use WebP format, exactly 512x512 pixels',
      },
    };
  }
}