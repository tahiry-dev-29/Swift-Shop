import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
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
  private readonly events$ = new Subject<NotificationEvent>();
  private pubClient!: Redis;
  private subClient!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);

    this.subClient.subscribe('commerce:notifications');
    this.subClient.on('message', (channel, message) => {
      if (channel === 'commerce:notifications') {
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
    this.pubClient.publish('commerce:notifications', JSON.stringify(event));
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
