import { FileValidationPipe } from './file-validation.pipe';

export class ImageValidationPipe extends FileValidationPipe {
  // 5MB default for images
  // and allows up to 10 files by default
  constructor(maxSize: number = 5 * 1024 * 1024, maxFiles: number = 10) {
    super({
      maxSize,
      maxFiles,
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      checkMagicNumbers: true,
    });
  }
}
// Document validation pipe
export class DocumentValidationPipe extends FileValidationPipe {
  // 5MB default for documents
  constructor(maxSize: number = 5 * 1024 * 1024) {
    super({
      maxSize,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedExtensions: ['.pdf', '.doc', '.docx'],
      checkMagicNumbers: true,
    });
  }
}

// Video validation pipe
export class VideoValidationPipe extends FileValidationPipe {
  constructor(maxSize: number = 100 * 1024 * 1024) {
    super({
      maxSize,
      allowedMimeTypes: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
      ],
      allowedExtensions: ['.mp4', '.mpeg', '.mov', '.avi'],
      checkMagicNumbers: false, // Video magic numbers are complex
    });
  }
}
