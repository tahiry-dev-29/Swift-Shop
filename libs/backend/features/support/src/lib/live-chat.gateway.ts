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
import { PrismaService } from '@dima-new/data-access-prisma';

@WebSocketGateway({ namespace: 'support', cors: { origin: '*' } })
export class LiveChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiveChatGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to LiveChatGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from LiveChatGateway: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async joinChat(
    @MessageBody() data: { sessionId?: string; customerId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    let sessionId = data.sessionId;

    if (sessionId) {
      const existing = await this.prisma.liveChatSession.findUnique({
        where: { id: sessionId },
      });
      if (!existing) {
        throw new WsException(`Session ${sessionId} not found`);
      }
    } else {
      const session = await this.prisma.liveChatSession.create({
        data: {
          customerId: data.customerId ?? null,
          status: 'ACTIVE',
        },
      });
      sessionId = session.id;
    }

    client.join(sessionId);
    this.logger.log(`Client ${client.id} joined session ${sessionId}`);

    return { event: 'joined', data: { sessionId } };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody()
    data: {
      sessionId: string;
      senderType: string;
      senderId?: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const session = await this.prisma.liveChatSession.findUnique({
      where: { id: data.sessionId },
    });
    if (!session) {
      throw new WsException(`Session ${data.sessionId} not found`);
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        sessionId: data.sessionId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
      },
    });

    client.to(data.sessionId).emit('newMessage', message);

    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('agentTyping')
  async agentTyping(
    @MessageBody() data: { sessionId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.sessionId).emit('typingStatus', { isTyping: data.isTyping });
  }
}
