import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from 'src/common/pipes';

@Controller('images')
export class ImagesController {
  @Post('multiple-images')
  @UseInterceptors(FilesInterceptor('images'))
  uploadMultipleImages(
    @UploadedFiles(new ImageValidationPipe(5149, 10))
    files: Express.Multer.File[],
  ) {
    console.log('Files received:', files);
    // Here you can handle the files, e.g., save them to a database or cloud
    // For demonstration, we will just return the files information
    return {
      message: 'Images uploaded successfully',
      totalFiles: files.length,
      files: files.map((file) => ({
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      })),
    };
  }
}
