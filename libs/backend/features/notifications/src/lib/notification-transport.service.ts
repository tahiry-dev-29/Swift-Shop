import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';
import {
  NotificationEvent,
  NotificationRecipient,
} from './interfaces/notification-recipient.interface';

@Injectable()
export class NotificationTransportService {
  private readonly events$ = new Subject<NotificationEvent>();

  publish(event: NotificationEvent) {
    this.events$.next(event);
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
  ) {
    return (
      (left.customerId && left.customerId === right.customerId) ||
      (left.employeeId && left.employeeId === right.employeeId)
    );
  }
}
