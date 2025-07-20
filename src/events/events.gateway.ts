import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  @SubscribeMessage('hi-server')
  handelHiEvent(@MessageBody() body: any) {
    console.log('Received hi-server event with body:', body);
    this.server.emit('hi-client', { message: 'Hi from server!' });
  }

  @SubscribeMessage('hello')
  handleHelloEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    console.log(
      'Received hello event with body:',
      data,
      'from client:',
      client.id,
    );
    client.emit('hello-client', { message: 'Hello from server!' });
  }
}
