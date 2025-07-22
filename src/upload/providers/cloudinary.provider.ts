import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(private configService: ConfigService) {
    // Initialize Cloudinary configuration
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    filename?: string,
  ): Promise<string> {
    try {
      const finalFilename =
        filename || `${Date.now()}-${path.parse(file.originalname).name}`;

      // Return a promise that resolves with the public URL
      return new Promise((resolve, reject) => {
        // Create upload stream to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: finalFilename,
            resource_type: 'auto', // Auto-detect resource type
          },
          (error, result) => {
            if (error) {
              this.logger.error(
                `Failed to upload to Cloudinary: ${error.message}`,
              );
              return reject(error);
            }

            // Return the secure URL from the response
            resolve(result.secure_url);
          },
        );

        // Write the file buffer to the upload stream
        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(
        `Failed to upload file to Cloudinary: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract public_id from URL
      const publicId = this.getPublicIdFromUrl(fileUrl);

      // Delete the file from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok' || result.result === 'not found') {
        return true;
      }

      this.logger.warn(
        `Cloudinary returned unexpected result: ${result.result}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Cloudinary: ${error.message}`,
      );
      return false;
    }
  }

  // Helper method to extract public_id from Cloudinary URL
  private getPublicIdFromUrl(fileUrl: string): string {
    try {
      // Parse the URL to extract components
      const url = new URL(fileUrl);
      const pathname = url.pathname;

      // Cloudinary URLs typically look like:
      // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.ext

      // Extract parts after /upload/
      const uploadIndex = pathname.indexOf('/upload/');
      if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL format');
      }

      // Get the part after /upload/ and remove the version prefix if present
      let publicPath = pathname.substring(uploadIndex + 8); // +8 for "/upload/"

      // Remove version component if present (v1234567890/)
      const versionMatch = publicPath.match(/^v\d+\//);
      if (versionMatch) {
        publicPath = publicPath.substring(versionMatch[0].length);
      }

      // Remove file extension
      const extIndex = publicPath.lastIndexOf('.');
      if (extIndex !== -1) {
        publicPath = publicPath.substring(0, extIndex);
      }

      return publicPath;
    } catch (error) {
      this.logger.error(`Failed to parse Cloudinary URL: ${error.message}`);
      throw new Error('Invalid file URL');
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      return Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error(
        `Failed to upload multiple files to Cloudinary: ${error.message}`,
      );
      throw error;
    }
  }
}
