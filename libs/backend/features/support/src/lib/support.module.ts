import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { SupportTicketRepository } from './support-ticket.repository';
import { SupportTicketFormatter } from './support-ticket.formatter';
import { SupportTicketService } from './support-ticket.service';
import { LiveChatGateway } from './live-chat.gateway';
import { SupportTicketResolver } from './support-ticket.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    SupportTicketRepository,
    SupportTicketFormatter,
    SupportTicketService,
    LiveChatGateway,
    SupportTicketResolver,
  ],
  exports: [SupportTicketService],
})
export class SupportModule {}
