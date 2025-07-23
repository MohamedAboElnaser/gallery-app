import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { CloudinaryStorageProvider } from '../providers/cloudinary.provider';
import { LocalStorageProvider } from '../providers/local.provider';

export type StorageProviderType = 'cloudinary' | 's3' | 'local' | 'supabase';

@Injectable()
export class StorageProviderFactory {
  constructor(private configService: ConfigService) {}

  createProvider(type: StorageProviderType): StorageProvider {
    switch (type) {
      case 'cloudinary':
        return new CloudinaryStorageProvider(this.configService);
      case 'local':
        return new LocalStorageProvider();
      // Add other providers here when implemented
      default:
        return new CloudinaryStorageProvider(this.configService); // Default to Cloudinary for now
    }
  }

  createDefaultProvider(): StorageProvider {
    const defaultProvider = this.configService.get<StorageProviderType>(
      'STORAGE_PROVIDER',
      'cloudinary', // Default to Cloudinary if not set
    );
    return this.createProvider(defaultProvider);
  }
}
