export interface FileData {
  fileIndex: number;
  fileName: string;
  status: 'completed';
  progress: number;
  imageData: {
    id: number;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileURL: string;
    publicId: string;
    userId: number;
    sessionId: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
