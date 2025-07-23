import { IsOptional, IsString } from 'class-validator';

export class UploadImagesDto {
  @IsOptional()
  @IsString()
  sessionId?: string;
}
