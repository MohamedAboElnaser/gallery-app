import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadPath = process.env.LOCAL_UPLOAD_PATH;

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    filename?: string,
  ): Promise<string> {
    if (!file || !folder) {
      throw new Error('File and folder are required');
    }
    // for unique filename generation
    const finalFilename =
      filename ||
      `${file.originalname.split('.')[0]}-${Math.random().toString(36).substring(2, 15)}.${file.originalname.split('.').pop()}`;
    const folderPath = path.join(this.uploadPath, folder);
    const filePath = path.join(folderPath, finalFilename);

    // Create directory if it doesn't exist
    await mkdir(folderPath, { recursive: true });

    // Write file to disk
    await writeFile(filePath, file.buffer);

    // Return relative path from uploads directory
    return path.join(folder, finalFilename);
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new Error('Files are required');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));

    return Promise.all(uploadPromises);
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadPath, fileUrl);

      // Check if file exists
      await access(filePath, fs.constants.F_OK);

      // Delete the file
      await unlink(filePath);

      return true;
    } catch (error) {
      // File doesn't exist or couldn't be deleted
      console.error(`Failed to delete file ${fileUrl}:`, error);
      return false;
    }
  }

  async deleteFiles(fileUrls: string[]): Promise<boolean[]> {
    if (!fileUrls || fileUrls.length === 0) {
      throw new Error('File URLs are required');
    }

    const deletePromises = fileUrls.map((fileUrl) => this.deleteFile(fileUrl));

    return Promise.all(deletePromises);
  }
}
