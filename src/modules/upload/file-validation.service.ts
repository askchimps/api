import { Injectable } from '@nestjs/common';
import { WhatsAppCompatibilityService } from './whatsapp-compatibility.service';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFileName?: string;
  whatsappCompatible?: boolean;
  whatsappWarnings?: string[];
}

@Injectable()
export class FileValidationService {
  private readonly maxFileSizes = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 20 * 1024 * 1024, // 20MB
  };

  constructor(
    private readonly whatsappCompatibilityService: WhatsAppCompatibilityService,
  ) {}

  private readonly allowedMimeTypes = {
    image: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    video: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo' // .avi
    ],
    audio: [
      'audio/mpeg', // mp3
      'audio/wav',
      'audio/ogg',
      'audio/mp4', // m4a
      'audio/webm'
    ],
    document: [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain',
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ]
  };

  validateFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    category: 'image' | 'video' | 'audio' | 'document',
    metadata?: any
  ): FileValidationResult {
    // Check file size
    const maxSize = this.maxFileSizes[category];
    if (buffer.length > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`
      };
    }

    // Check MIME type
    if (!this.allowedMimeTypes[category].includes(mimetype)) {
      return {
        isValid: false,
        error: `File type ${mimetype} not allowed for ${category} category`
      };
    }

    // Sanitize filename
    const sanitizedFileName = this.sanitizeFileName(filename);

    // Additional security checks
    const securityCheck = this.performSecurityChecks(buffer, mimetype);
    if (!securityCheck.isValid) {
      return securityCheck;
    }

    // Check WhatsApp compatibility
    const whatsappValidation = this.whatsappCompatibilityService.validateForWhatsApp(
      mimetype,
      buffer.length,
      category,
      metadata
    );

    const result: FileValidationResult = {
      isValid: true,
      sanitizedFileName,
      whatsappCompatible: whatsappValidation.isValid,
    };

    if (!whatsappValidation.isValid) {
      result.whatsappWarnings = [whatsappValidation.error || 'Not WhatsApp compatible'];
      if (whatsappValidation.recommendedFormat) {
        result.whatsappWarnings.push(`Recommended: ${whatsappValidation.recommendedFormat}`);
      }
    }

    return result;
  }

  private sanitizeFileName(filename: string): string {
    // Remove any path components
    const basename = filename.replace(/.*[\/\\]/, '');
    
    // Replace unsafe characters
    const sanitized = basename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    // Ensure it doesn't start with a dot or dash
    return sanitized.replace(/^[.-]+/, '');
  }

  private performSecurityChecks(buffer: Buffer, mimetype: string): FileValidationResult {
    // Check for executable file signatures
    const executableSignatures = [
      [0x4D, 0x5A], // PE/COFF executable
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
    ];

    for (const signature of executableSignatures) {
      if (this.bufferStartsWith(buffer, signature)) {
        return {
          isValid: false,
          error: 'Executable files are not allowed'
        };
      }
    }

    // Additional MIME type verification for images
    if (mimetype.startsWith('image/')) {
      const imageSignatures = {
        'image/jpeg': [[0xFF, 0xD8, 0xFF]],
        'image/png': [[0x89, 0x50, 0x4E, 0x47]],
        'image/gif': [[0x47, 0x49, 0x46, 0x38]],
        'image/webp': [[0x52, 0x49, 0x46, 0x46]]
      };

      const expectedSignatures = imageSignatures[mimetype as keyof typeof imageSignatures];
      if (expectedSignatures) {
        const hasValidSignature = expectedSignatures.some(signature => 
          this.bufferStartsWith(buffer, signature)
        );
        
        if (!hasValidSignature) {
          return {
            isValid: false,
            error: 'File content does not match declared MIME type'
          };
        }
      }
    }

    return { isValid: true };
  }

  private bufferStartsWith(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    
    return true;
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getMaxFileSize(category: 'image' | 'video' | 'audio' | 'document'): number {
    return this.maxFileSizes[category];
  }

  getAllowedMimeTypes(category: 'image' | 'video' | 'audio' | 'document'): string[] {
    return [...this.allowedMimeTypes[category]];
  }
}