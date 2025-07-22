import { Injectable, Inject, Logger } from '@nestjs/common';
import { StorageProvider } from './interfaces/storage-provider.interface';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: StorageProvider,
  ) {
    this.logger.log(
      `UploadService initialized with provider: ${this.storageProvider.constructor.name}`,
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    filename?: string,
  ): Promise<string> {
    return this.storageProvider.uploadFile(file, folder, filename);
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    return this.storageProvider.uploadFiles(files, folder);
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    return this.storageProvider.deleteFile(fileUrl);
  }
}
