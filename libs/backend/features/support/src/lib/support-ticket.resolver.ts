import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import {
  SupportTicketType,
  TicketMessageType,
  CreateTicketInput,
  ReplyTicketInput,
  AssignTicketInput,
} from './dto';
import {
  CustomerGuard,
  EmployeeGuard,
  CurrentUser,
  AuthUser,
} from '@swift-shop/backend/auth';

@Resolver()
export class SupportTicketResolver {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  // Customers can create a ticket
  @Mutation(() => SupportTicketType)
  @UseGuards(CustomerGuard)
  async createSupportTicket(
    @Args('input') input: CreateTicketInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportTicketService.createTicket({
      ...input,
      customerId: user.id,
    });
  }

  // Customers reply to their own ticket
  @Mutation(() => TicketMessageType)
  @UseGuards(CustomerGuard)
  async replyToTicket(
    @Args('ticketId', { type: () => ID }) ticketId: string,
    @Args('input') input: ReplyTicketInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportTicketService.replyToTicket(ticketId, {
      ...input,
      senderId: user.id,
      senderType: 'CUSTOMER',
    });
  }

  // Employee replies (can be internal notes)
  @Mutation(() => TicketMessageType)
  @UseGuards(EmployeeGuard)
  async agentReplyToTicket(
    @Args('ticketId', { type: () => ID }) ticketId: string,
    @Args('input') input: ReplyTicketInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportTicketService.replyToTicket(ticketId, {
      ...input,
      senderId: user.id,
      senderType: 'EMPLOYEE',
    });
  }

  // Employee assigns ticket
  @Mutation(() => SupportTicketType)
  @UseGuards(EmployeeGuard)
  async assignSupportTicket(
    @Args('ticketId', { type: () => ID }) ticketId: string,
    @Args('input') input: AssignTicketInput,
  ) {
    const ticket = await this.supportTicketService.assignTicket(
      ticketId,
      input,
    );
    if (!ticket) {
      throw new NotFoundException(`Ticket #${ticketId} not found`);
    }
    return ticket;
  }

  // Employee lists all tickets
  @Query(() => [SupportTicketType])
  @UseGuards(EmployeeGuard)
  async supportTickets() {
    return this.supportTicketService.findAll();
  }

  // Customer views their own tickets
  @Query(() => [SupportTicketType])
  @UseGuards(CustomerGuard)
  async mySupportTickets(@CurrentUser() user: AuthUser) {
    return this.supportTicketService.findByCustomer(user.id);
  }
}
