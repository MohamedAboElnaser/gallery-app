import { Express } from 'express';

export interface StorageProvider {
  uploadFile(
    file: Express.Multer.File,
    folder: string,
    filename?: string,
  ): Promise<string>;

  uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]>;

  deleteFile(fileUrl: string): Promise<boolean>;

  deleteFiles(fileUrls: string[]): Promise<boolean[]>;
}
