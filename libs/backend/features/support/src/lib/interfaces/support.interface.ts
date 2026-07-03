export interface CreateTicketDto {
  customerId?: string;
  subject: string;
  message: string;
  priority?: string;
}

export interface ReplyTicketDto {
  senderId?: string;
  senderType: 'CUSTOMER' | 'EMPLOYEE' | 'SYSTEM';
  content: string;
  isInternal?: boolean;
}

export interface AssignTicketDto {
  employeeId: string;
}

export interface JoinChatDto {
  customerId?: string;
  guestName?: string;
}

export interface SendMessageDto {
  sessionId: string;
  senderType: 'CUSTOMER' | 'EMPLOYEE' | 'SYSTEM';
  senderId?: string;
  content: string;
}
