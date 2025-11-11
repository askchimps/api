import { 
  Controller, 
  Post, 
  Get,
  UseGuards, 
  BadRequestException,
  Logger,
  Req
} from '@nestjs/common';
import { HeaderAuthGuard } from '../../guards/header-auth.guard';
import { UploadService, MultipartFile } from './upload.service';
import { FileValidationService } from './file-validation.service';
import { WhatsAppCompatibilityService } from './whatsapp-compatibility.service';

@Controller({
  path: 'upload',
  version: '1',
})
@UseGuards(HeaderAuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly fileValidationService: FileValidationService,
    private readonly whatsAppCompatibilityService: WhatsAppCompatibilityService,
  ) {}

  @Post('single')
  async uploadSingleFile(
    @Req() request: any,
  ) {
    this.logger.log(`=== SINGLE UPLOAD REQUEST START ===`);
    this.logger.log(`Request URL: ${request.url}`);
    this.logger.log(`Request Method: ${request.method}`);
    this.logger.log(`Content-Type: ${request.headers['content-type']}`);

    try {
      // Check if it's a multipart request
      if (!request.isMultipart()) {
        this.logger.error('Request is not multipart');
        throw new BadRequestException('Request must be multipart/form-data');
      }

      this.logger.log('Processing multipart data...');
      
      let category: string | undefined;
      let subfolder: string | undefined;
      let fileData: any | undefined;

      // Process multipart parts
      const parts = request.parts();
      for await (const part of parts) {
        this.logger.log(`Processing part: ${part.fieldname}, type: ${part.type}`);
        
        if (part.type === 'field') {
          // Handle form field
          if (part.fieldname === 'category') {
            category = part.value as string;
            this.logger.log(`Category field: ${category}`);
          }
          else if (part.fieldname === 'subFolder') {
            subfolder = part.value as string;
            this.logger.log(`Subfolder field: ${subfolder}`);
          }
        } else if (part.type === 'file') {
          // Handle file field
          this.logger.log(`File field: ${part.fieldname}, filename: ${part.filename}, mimetype: ${part.mimetype}`);
          
          // Read file buffer
          const buffer = await part.toBuffer();
          fileData = {
            buffer,
            filename: part.filename,
            mimetype: part.mimetype,
            encoding: part.encoding,
            size: buffer.length,
          };
          
          this.logger.log(`File processed: ${fileData.filename}, size: ${fileData.size} bytes`);
        }
      }

      // Validate required fields
      if (!category) {
        this.logger.error('Category not provided');
        throw new BadRequestException('Category is required');
      }

      if (!fileData) {
        this.logger.error('No file provided');
        throw new BadRequestException('No file provided');
      }

      // Validate category
      const validCategories = ['image', 'video', 'audio', 'document'];
      if (!validCategories.includes(category)) {
        this.logger.error(`Invalid category: ${category}`);
        throw new BadRequestException(`Category must be one of: ${validCategories.join(', ')}`);
      }

      this.logger.log(`Processing upload - Category: ${category}, File: ${fileData.filename}`);

      // Convert to MultipartFile interface
      const multipartFile: MultipartFile = {
        buffer: fileData.buffer,
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        encoding: fileData.encoding,
        size: fileData.size,
      };

      // Upload file
      const result = await this.uploadService.uploadFile(
        multipartFile,
        category as 'image' | 'video' | 'audio' | 'document',
        subfolder
      );

      this.logger.log(`Single file upload completed successfully - ${fileData.filename}`);
      this.logger.log(`=== SINGLE UPLOAD REQUEST END ===`);
      return {
        success: true,
        data: result,
      };
      
    } catch (error) {
      this.logger.error(`Single file upload failed:`, error?.stack || error);
      this.logger.log(`=== SINGLE UPLOAD REQUEST END (ERROR) ===`);
      throw error;
    }
  }

  @Post('multiple')
  async uploadMultipleFiles(
    @Req() request: any
  ) {
    this.logger.log(`=== MULTIPLE UPLOAD REQUEST START ===`);
    this.logger.log(`Request URL: ${request.url}`);
    this.logger.log(`Request Method: ${request.method}`);
    this.logger.log(`Content-Type: ${request.headers['content-type']}`);

    try {
      // Check if it's a multipart request
      if (!request.isMultipart()) {
        this.logger.error('Request is not multipart');
        throw new BadRequestException('Request must be multipart/form-data');
      }

      this.logger.log('Processing multipart data for multiple files...');
      
      let category: string | undefined;
      const filesData: any[] = [];

      // Process multipart parts
      const parts = request.parts();
      for await (const part of parts) {
        this.logger.log(`Processing part: ${part.fieldname}, type: ${part.type}`);
        
        if (part.type === 'field') {
          // Handle form field
          if (part.fieldname === 'category') {
            category = part.value as string;
            this.logger.log(`Category field: ${category}`);
          }
        } else if (part.type === 'file') {
          // Handle file field
          this.logger.log(`File field: ${part.fieldname}, filename: ${part.filename}, mimetype: ${part.mimetype}`);
          
          // Read file buffer
          const buffer = await part.toBuffer();
          const fileData = {
            buffer,
            filename: part.filename,
            mimetype: part.mimetype,
            encoding: part.encoding,
            size: buffer.length,
          };
          
          filesData.push(fileData);
          this.logger.log(`File processed: ${fileData.filename}, size: ${fileData.size} bytes`);
        }
      }

      // Validate required fields
      if (!category) {
        this.logger.error('Category not provided');
        throw new BadRequestException('Category is required');
      }

      if (filesData.length === 0) {
        this.logger.error('No files provided');
        throw new BadRequestException('No files provided');
      }

      // Validate category
      const validCategories = ['image', 'video', 'audio', 'document'];
      if (!validCategories.includes(category)) {
        this.logger.error(`Invalid category: ${category}`);
        throw new BadRequestException(`Category must be one of: ${validCategories.join(', ')}`);
      }

      this.logger.log(`Processing ${filesData.length} files upload - Category: ${category}`);

      // Convert to MultipartFile interface
      const multipartFiles: MultipartFile[] = filesData.map(fileData => ({
        buffer: fileData.buffer,
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        encoding: fileData.encoding,
        size: fileData.size,
      }));

      // Upload files
      const results = await this.uploadService.uploadMultipleFiles(
        multipartFiles,
        category as 'image' | 'video' | 'audio' | 'document'
      );

      this.logger.log(`Multiple files upload completed - ${results.length}/${filesData.length} files uploaded successfully`);
      this.logger.log(`=== MULTIPLE UPLOAD REQUEST END ===`);
      return {
        success: true,
        data: results,
      };
      
    } catch (error) {
      this.logger.error(`Multiple files upload failed:`, error?.stack || error);
      this.logger.log(`=== MULTIPLE UPLOAD REQUEST END (ERROR) ===`);
      throw error;
    }
  }

  @Get('validation-info')
  getValidationInfo() {
    this.logger.debug('Fetching validation info for all file categories');
    try {
      const categories = ['image', 'video', 'audio', 'document'] as const;
      const info: Record<string, any> = {};

      categories.forEach(category => {
        info[category] = {
          maxSize: this.fileValidationService.getMaxFileSize(category),
          allowedTypes: this.fileValidationService.getAllowedMimeTypes(category),
        };
      });

      this.logger.debug('Validation info retrieved successfully');
      return {
        success: true,
        data: info,
      };
    } catch (error) {
      this.logger.error('Failed to get validation info:', error?.stack || error);
      throw error;
    }
  }

  @Get('whatsapp-limits')
  getWhatsAppLimits() {
    this.logger.debug('Fetching WhatsApp limits');
    try {
      const limits = this.whatsAppCompatibilityService.getWhatsAppLimits();
      this.logger.debug('WhatsApp limits retrieved successfully');
      return {
        success: true,
        data: limits,
      };
    } catch (error) {
      this.logger.error('Failed to get WhatsApp limits:', error?.stack || error);
      throw error;
    }
  }
}