import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicNumbers?: boolean;
  required?: boolean;
  maxFiles?: number; // New option for multiple files
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly options: Required<FileValidationOptions>;

  constructor(options: FileValidationOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 5 * 1024 * 1024,
      allowedMimeTypes: options.allowedMimeTypes ?? [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      allowedExtensions: options.allowedExtensions ?? [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
      ],
      checkMagicNumbers: options.checkMagicNumbers ?? true,
      required: options.required ?? true,
      maxFiles: options.maxFiles ?? 10,
    };
  }

  transform(files: Express.Multer.File | Express.Multer.File[]) {
    // Handle both single file and multiple files
    if (Array.isArray(files)) {
      return this.validateMultipleFiles(files);
    } else {
      return this.validateSingleFile(files);
    }
  }

  private validateMultipleFiles(
    files: Express.Multer.File[],
  ): Express.Multer.File[] {
    if (!files || files.length === 0) {
      if (this.options.required) {
        throw new BadRequestException('At least one file is required');
      }
      return files;
    }

    // Check max files limit
    if (files.length > this.options.maxFiles) {
      throw new BadRequestException(
        `Too many files. Maximum allowed: ${this.options.maxFiles}`,
      );
    }

    // Validate each file
    files.forEach((file, index) => {
      try {
        this.validateSingleFile(file);
      } catch (error) {
        throw new BadRequestException(`File ${index + 1}: ${error.message}`);
      }
    });

    return files;
  }

  private validateSingleFile(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      if (this.options.required) {
        throw new BadRequestException('File is required');
      }
      return file;
    }

    // Check file size
    if (file.size > this.options.maxSize) {
      throw new BadRequestException(
        `File "${file.originalname}" size exceeds ${this.formatBytes(this.options.maxSize)} limit`,
      );
    }

    // Check MIME type
    if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for "${file.originalname}". Allowed types: ${this.options.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension
    const fileExtension = file.originalname
      .toLowerCase()
      .match(/\.[^.]+$/)?.[0];

    if (
      !fileExtension ||
      !this.options.allowedExtensions.includes(fileExtension)
    ) {
      throw new BadRequestException(
        `Invalid file extension for "${file.originalname}". Allowed extensions: ${this.options.allowedExtensions.join(', ')}`,
      );
    }

    // Validate file content (magic numbers) if enabled
    if (
      this.options.checkMagicNumbers &&
      !this.isValidFile(file.buffer, file.mimetype)
    ) {
      throw new BadRequestException(
        `File content of "${file.originalname}" does not match the expected format`,
      );
    }

    return file;
  }

  private isValidFile(buffer: Buffer, mimetype: string): boolean {
    switch (mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'image/png':
        return (
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47
        );
      case 'image/gif':
        return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
      case 'image/webp':
        return (
          buffer[8] === 0x57 &&
          buffer[9] === 0x45 &&
          buffer[10] === 0x42 &&
          buffer[11] === 0x50
        );
      default:
        return true;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
