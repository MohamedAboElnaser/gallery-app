import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { StorageProviderFactory } from './factories/storage-provider.factory';
import { CloudinaryStorageProvider } from './providers/cloudinary.provider';

@Module({
  providers: [
    UploadService,
    StorageProviderFactory,
    CloudinaryStorageProvider,
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (factory: StorageProviderFactory) => {
        return factory.createDefaultProvider();
      },
      inject: [StorageProviderFactory],
    },
  ],
  exports: [UploadService, 'STORAGE_PROVIDER'],
})
export class UploadModule {}
