import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AuthUser, CurrentUser, JwtAuthGuard } from '@swift-shop/backend/auth';
import { NotificationService } from './notification.service';
import { NotificationActorType } from './interfaces/notification-recipient.interface';

@Controller('notifications')
export class NotificationSseController {
  constructor(private readonly notificationService: NotificationService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    return this.notificationService
      .streamForUser(user.type as NotificationActorType, user.id)
      .pipe(
        map((event) => ({
          type: 'notification',
          data: event.notification,
        })),
      );
  }
}
