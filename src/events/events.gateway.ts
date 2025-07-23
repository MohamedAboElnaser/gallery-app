import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { FileData, UploadProgress, SessionData } from 'src/events/interfaces';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('🚀 WebSocket server initialized...');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🟢 Client connected with id : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔴 Client disconnected with id : ${client.id}`);
  }

  @SubscribeMessage('joinUploadSession')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `session-${data.sessionId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    return { event: 'joinedSession', data: { sessionId: data.sessionId } };
  }

  emitUploadProgress(sessionId: string, progress: UploadProgress) {
    const roomName = `session-${sessionId}`;
    this.logger.log(`Emitting uploadProgress to room: ${roomName}`, progress);
    this.server.to(roomName).emit('uploadProgress', progress);
  }

  emitFileProcessed(sessionId: string, fileData: FileData) {
    const roomName = `session-${sessionId}`;
    this.logger.log(`Emitting fileProcessed to room: ${roomName}`);
    this.server.to(roomName).emit('fileProcessed', fileData);
  }

  emitSessionCompleted(sessionId: string, sessionData: SessionData) {
    const roomName = `session-${sessionId}`;
    this.logger.log(`Emitting sessionCompleted to room: ${roomName}`);
    this.server.to(roomName).emit('sessionCompleted', sessionData);
  }
}
