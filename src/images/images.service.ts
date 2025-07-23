import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { EventsGateway } from 'src/events/events.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService, // Using abstracted service
    private readonly eventsGateway: EventsGateway,
  ) {}

  async uploadImages(
    files: Express.Multer.File[],
    userId: number,
    sessionId?: string,
  ) {
    const uploadSessionId = sessionId || uuidv4();

    // Create upload session
    const session = await this.prisma.uploadSession.create({
      data: {
        sessionId: uploadSessionId,
        userId,
        totalFiles: files.length,
      },
    });

    // Emit session started event immediately
    this.eventsGateway.emitUploadProgress(uploadSessionId, {
      fileIndex: -1, // -1 indicates session start
      fileName: 'Session Started',
      status: 'session_started',
      progress: 0,
      totalFiles: files.length,
    });

    // Process files with the abstracted upload service
    const uploadPromises = files.map(async (file, index) => {
      return this.processFileWithProgress(
        file,
        userId,
        session.id,
        index,
        uploadSessionId,
      );
    });

    await Promise.all(uploadPromises);

    // Mark session as completed
    await this.prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: 'completed' },
    });

    this.eventsGateway.emitSessionCompleted(uploadSessionId, {
      sessionId: uploadSessionId,
      totalFiles: files.length,
      status: 'completed',
    });

    return { sessionId: uploadSessionId, totalFiles: files.length };
  }

  private async processFileWithProgress(
    file: Express.Multer.File,
    userId: number,
    sessionId: number,
    fileIndex: number,
    uploadSessionId: string,
  ) {
    try {
      // Emit processing start processing 0%...
      this.eventsGateway.emitUploadProgress(uploadSessionId, {
        fileIndex,
        fileName: file.originalname,
        status: 'processing',
        progress: 0,
      });

      // Simulate processing with progress updates
      // Through emitting progress events : 25%, 50%, 75%
      for (let progress = 25; progress <= 75; progress += 25) {
        await this.delay(500);
        this.eventsGateway.emitUploadProgress(uploadSessionId, {
          fileIndex,
          fileName: file.originalname,
          status: 'processing',
          progress,
        });
      }
      // Actually upload the file
      // Upload using abstracted service (provider-agnostic)
      const fileUrl = await this.uploadService.uploadFile(
        file,
        'gallery-images',
      );

      // Extract public_id from URL (this would need to be provider-agnostic too)
      const publicId = this.extractPublicIdFromUrl(fileUrl);

      // Save to database
      const savedImage = await this.prisma.image.create({
        data: {
          fileName: `${Date.now()}-${file.originalname}`,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileURL: fileUrl,
          publicId,
          userId,
          sessionId,
        },
      });

      // Update session progress
      await this.prisma.uploadSession.update({
        where: { id: sessionId },
        data: {
          completedFiles: {
            increment: 1,
          },
        },
      });

      // Emit completion event with 100% progress
      this.eventsGateway.emitFileProcessed(uploadSessionId, {
        fileIndex,
        fileName: file.originalname,
        status: 'completed',
        progress: 100,
        imageData: savedImage,
      });

      return savedImage;
    } catch (error) {
      this.eventsGateway.emitUploadProgress(uploadSessionId, {
        fileIndex,
        fileName: file.originalname,
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractPublicIdFromUrl(url: string): string {
    // This should also be provider-agnostic
    // For now, I will keep it simple
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    return filename.split('.')[0];
  }
}
