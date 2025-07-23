export interface SessionData {
  sessionId: string;
  totalFiles: number;
  status: 'processing' | 'completed' | 'failed';
}
