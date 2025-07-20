import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class EventsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    console.log('EventsGateway initialized..');
    this.server.on('connection', (socket) => {
      console.log(`🟢Client connected with id: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`🔴Client disconnected with id: ${socket.id}`);
      });
    });
  }
}
