import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EmployeeGuard,
  JwtAuthGuard,
} from '@swift-shop/backend/auth';
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
import { NotificationTransportService } from './notification-transport.service';

interface GqlContext {
  req: { user?: AuthUser };
}

@Resolver(() => NotificationType)
export class NotificationResolver {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly transportService: NotificationTransportService,
  ) {}

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

  /** Real-time stream — graphql-ws handles the WebSocket upgrade */
  @Subscription(() => NotificationType, {
    filter(
      payload: { notificationReceived: NotificationType },
      _args: unknown,
      context: GqlContext,
    ) {
      const user = context.req?.user;
      if (!user) return false;
      const n = payload.notificationReceived;
      return user.type === 'customer'
        ? n.customerId === user.id
        : n.employeeId === user.id;
    },
    resolve: (payload: { notificationReceived: NotificationType }) =>
      payload.notificationReceived,
  })
  @UseGuards(JwtAuthGuard)
  notificationReceived(@Context() ctx: GqlContext) {
    const user = ctx.req?.user;
    if (!user) {
      throw new Error('Unauthenticated subscription');
    }
    return this.transportService.streamForRecipient(
      this.notificationService.recipientFromActor(
        user.type as NotificationActorType,
        user.id,
      ),
    );
  }
}
