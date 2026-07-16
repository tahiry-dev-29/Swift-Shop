import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { filter, Observable, Subject } from 'rxjs';
import {
  NotificationEvent,
  NotificationRecipient,
} from './interfaces/notification-recipient.interface';

@Injectable()
export class NotificationTransportService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationTransportService.name);
  private readonly events$ = new Subject<NotificationEvent>();
  private pubClient!: Redis;
  private subClient!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    const opts = {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      keyPrefix: 'swift-shop:',
    };
    this.pubClient = new Redis(redisUrl, opts);
    this.subClient = new Redis(redisUrl, opts);

    this.pubClient.on('error', (err) =>
      this.logger.error('Redis pub client error', err),
    );
    this.subClient.on('error', (err) =>
      this.logger.error('Redis sub client error', err),
    );

    this.pubClient.connect().catch(() => undefined);
    this.subClient.connect().catch(() => undefined);

    this.subClient
      .subscribe('swift-shop:commerce:notifications')
      .catch(() => undefined);
    this.subClient.on('message', (channel, message) => {
      if (channel === 'swift-shop:commerce:notifications') {
        try {
          const event = JSON.parse(message) as NotificationEvent;
          this.events$.next(event);
        } catch {
          // Ignore parse errors
        }
      }
    });
  }

  onModuleDestroy() {
    this.pubClient.disconnect();
    this.subClient.disconnect();
  }

  publish(event: NotificationEvent) {
    this.pubClient
      .publish('swift-shop:commerce:notifications', JSON.stringify(event))
      .catch(() => undefined);
  }

  streamForRecipient(
    recipient: NotificationRecipient,
  ): Observable<NotificationEvent> {
    return this.events$.pipe(
      filter((event) => this.isSameRecipient(event.recipient, recipient)),
    );
  }

  streamAll(): Observable<NotificationEvent> {
    return this.events$.asObservable();
  }

  private isSameRecipient(
    left: NotificationRecipient,
    right: NotificationRecipient,
  ): boolean {
    return !!(
      (left.customerId && left.customerId === right.customerId) ||
      (left.employeeId && left.employeeId === right.employeeId)
    );
  }
}
