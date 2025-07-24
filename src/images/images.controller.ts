import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Request,
  Body,
  ValidationPipe,
  UsePipes,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from 'src/common/pipes';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadImagesDto } from './dto/upload-images.dto';
import { GetImagesDto } from './dto/get-images.dto';
import { BulkDeleteImagesDto } from './dto/bulk-delete.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImages(
    @UploadedFiles(
      new ImageValidationPipe(
        +process.env.MAX_FILE_SIZE,
        +process.env.MAX_FILE_COUNT_PER_REQUEST,
      ),
    )
    files: Express.Multer.File[],
    @Body() uploadDto: UploadImagesDto,
    @Request() req: any,
  ) {
    return this.imagesService.uploadImages(
      files,
      req.user.sub,
      uploadDto?.sessionId,
    );
  }

  @Get()
  async getImages(@Query() query: GetImagesDto, @Request() req: any) {
    return await this.imagesService.getImages(req.user.sub, query);
  }

  @Delete('bulk-delete')
  async bulkDeleteImages(@Body() body: BulkDeleteImagesDto) {
    const res = await this.imagesService.deleteImages(body.imageIds);
    return {
      message: 'Images deleted successfully',
      deletedCount: res.length,
      failedCount: body.imageIds.length - res.length,
    };
  }
}
