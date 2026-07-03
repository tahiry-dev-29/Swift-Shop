import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';
import {
  EmailThreadType,
  EmailMessageType,
  SendMessageInput,
  ReplyToThreadInput,
} from '../dto';
import { CustomerGuard, CurrentUser, AuthUser } from '@dima-new/backend/auth';

@Resolver()
export class MessagingResolver {
  constructor(private readonly messagingService: MessagingService) {}

  @Query(() => [EmailThreadType])
  @UseGuards(CustomerGuard)
  async myInbox(@CurrentUser() user: AuthUser) {
    return this.messagingService.getInbox(user.id);
  }

  @Query(() => EmailThreadType)
  @UseGuards(CustomerGuard)
  async emailThread(@Args('id', { type: () => ID }) id: string) {
    return this.messagingService.getThread(id);
  }

  @Mutation(() => EmailThreadType)
  @UseGuards(CustomerGuard)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagingService.sendMessage(
      user.id,
      input.recipientId,
      input.subject,
      input.body,
    );
  }

  @Mutation(() => EmailMessageType)
  @UseGuards(CustomerGuard)
  async replyToThread(
    @Args('input') input: ReplyToThreadInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagingService.replyToThread(
      user.id,
      input.threadId,
      input.body,
    );
  }
}
