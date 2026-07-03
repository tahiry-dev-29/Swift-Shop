import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EmployeeGuard,
  JwtAuthGuard,
} from '@dima-new/backend/auth';
import { NotificationService } from './notification.service';
import {
  NotificationPreferenceInput,
  NotificationPreferenceType,
  NotificationType,
  PushSubscriptionInput,
  PushSubscriptionType,
  SendNotificationInput,
  UnreadNotificationCountType,
} from './dto';
import { NotificationActorType } from './interfaces/notification-recipient.interface';

@Resolver(() => NotificationType)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => [NotificationType])
  @UseGuards(JwtAuthGuard)
  async myNotifications(
    @CurrentUser() user: AuthUser,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('unreadOnly', { nullable: true }) unreadOnly?: boolean,
  ) {
    return this.notificationService.listForUser(
      user.type as NotificationActorType,
      user.id,
      { limit, unreadOnly },
    );
  }

  @Query(() => UnreadNotificationCountType)
  @UseGuards(JwtAuthGuard)
  async notificationUnreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.notificationService.getUnreadCount(
      user.type as NotificationActorType,
      user.id,
    );
    return { count };
  }

  @Mutation(() => [NotificationType])
  @UseGuards(EmployeeGuard)
  async sendNotification(@Args('input') input: SendNotificationInput) {
    return this.notificationService.send(input);
  }

  @Mutation(() => NotificationType)
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.notificationService.markAsRead(
      user.type as NotificationActorType,
      user.id,
      id,
    );
  }

  @Mutation(() => NotificationPreferenceType)
  @UseGuards(JwtAuthGuard)
  async updateNotificationPreference(
    @CurrentUser() user: AuthUser,
    @Args('input') input: NotificationPreferenceInput,
  ) {
    return this.notificationService.updatePreference(
      user.type as NotificationActorType,
      user.id,
      input,
    );
  }

  @Mutation(() => PushSubscriptionType)
  @UseGuards(JwtAuthGuard)
  async registerPushSubscription(
    @CurrentUser() user: AuthUser,
    @Args('input') input: PushSubscriptionInput,
  ) {
    return this.notificationService.registerPushSubscription(
      user.type as NotificationActorType,
      user.id,
      input,
    );
  }
}
