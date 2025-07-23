export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  status: 'session_started' | 'processing' | 'completed' | 'failed';
  progress?: number;
  totalFiles?: number;
  error?: string;
}
