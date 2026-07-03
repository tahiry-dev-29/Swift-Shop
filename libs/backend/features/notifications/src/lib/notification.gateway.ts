import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtPayload } from '@dima-new/models';
import { Subscription } from 'rxjs';
import { NotificationTransportService } from './notification-transport.service';
import { NotificationRecipient } from './interfaces/notification-recipient.interface';

interface NotificationSocket {
  handshake?: {
    auth?: {
      token?: string;
    };
    headers?: {
      authorization?: string;
    };
  };
  join(room: string): void;
}

interface NotificationServer {
  to(room: string): {
    emit(event: string, payload: unknown): void;
  };
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: true,
})
export class NotificationGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationGateway.name);
  private subscription?: Subscription;

  @WebSocketServer()
  private server?: NotificationServer;

  constructor(
    private readonly transportService: NotificationTransportService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.subscription = this.transportService.streamAll().subscribe((event) => {
      const room = this.roomForRecipient(event.recipient);
      if (!room) {
        return;
      }
      this.server?.to(room).emit('notification.received', event.notification);
    });
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }

  @SubscribeMessage('notifications.join')
  joinRecipientRoom(
    @ConnectedSocket() client: NotificationSocket,
    @MessageBody() recipient: NotificationRecipient,
  ) {
    this.assertSocketRecipient(client, recipient);

    const room = this.roomForRecipient(recipient);
    if (!room) {
      this.logger.warn('Rejected notification room join without recipient');
      return { joined: false };
    }

    client.join(room);
    return { joined: true };
  }

  private roomForRecipient(recipient: NotificationRecipient) {
    if (recipient.customerId) {
      return `customer:${recipient.customerId}`;
    }

    if (recipient.employeeId) {
      return `employee:${recipient.employeeId}`;
    }

    return undefined;
  }

  private assertSocketRecipient(
    client: NotificationSocket,
    recipient: NotificationRecipient,
  ) {
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new WsException('Invalid or expired token');
    }
    const expectedRecipient =
      payload.type === 'customer'
        ? { customerId: payload.sub }
        : { employeeId: payload.sub };

    if (
      this.roomForRecipient(expectedRecipient) !==
      this.roomForRecipient(recipient)
    ) {
      throw new WsException('Access denied');
    }
  }

  private extractToken(client: NotificationSocket) {
    const authToken = client.handshake?.auth?.token;
    if (authToken) {
      return authToken;
    }

    const authorization = client.handshake?.headers?.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return undefined;
    }

    return authorization.slice('Bearer '.length);
  }
}
