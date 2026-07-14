import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CourierChatService } from './courier-chat.service';

@WebSocketGateway({
  namespace: 'courier',
  cors: { origin: process.env['FRONTEND_URL'] || 'http://localhost:4200' },
})
export class CourierChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CourierChatGateway.name);

  constructor(private readonly courierChatService: CourierChatService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.['token'] ||
      client.handshake.headers['authorization'];
    if (!token) {
      this.logger.error(
        `Courier connection rejected: No auth token for ${client.id}`,
      );
      client.disconnect();
      return;
    }
    this.logger.log(`Courier client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Courier client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async joinChat(
    @MessageBody() data: { shipmentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = await this.courierChatService.getOrCreateSession(
      data.shipmentId,
    );
    client.join(session.id);
    this.logger.log(`Client ${client.id} joined courier chat ${session.id}`);

    return { event: 'joined', data: { sessionId: session.id } };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody()
    data: {
      sessionId: string;
      senderType: string;
      senderId: string | null;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.courierChatService.sendMessage(
      data.sessionId,
      data.senderType,
      data.senderId,
      data.content,
    );

    client.to(data.sessionId).emit('newMessage', message);

    return { event: 'messageSent', data: message };
  }
}
