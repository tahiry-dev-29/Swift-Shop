import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LiveChatGateway } from './live-chat.gateway';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

describe('LiveChatGateway WebSocket Tests', () => {
  let gateway: LiveChatGateway;
  let prismaMock: {
    liveChatSession: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    chatMessage: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  let mockSocket: {
    id: string;
    handshake: {
      auth?: Record<string, string>;
      headers: Record<string, string>;
    };
    disconnect: ReturnType<typeof vi.fn>;
    join: ReturnType<typeof vi.fn>;
    to: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      liveChatSession: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      chatMessage: {
        create: vi.fn(),
      },
    };

    mockSocket = {
      id: 'socket-client-1',
      handshake: {
        auth: { token: 'valid-jwt-token' },
        headers: {},
      },
      disconnect: vi.fn(),
      join: vi.fn(),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    gateway = new LiveChatGateway(prismaMock as unknown as PrismaService);
  });

  describe('handleConnection', () => {
    it('should disconnect socket client if no auth token is provided', () => {
      mockSocket.handshake.auth = undefined;
      gateway.handleConnection(mockSocket as unknown as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('joinChat', () => {
    it('should create new live chat session if sessionId is omitted', async () => {
      prismaMock.liveChatSession.create.mockResolvedValue({
        id: 'new-session-id',
        customerId: 'cust-1',
        status: 'ACTIVE',
      });

      const res = await gateway.joinChat(
        { customerId: 'cust-1' },
        mockSocket as unknown as Socket,
      );

      expect(prismaMock.liveChatSession.create).toHaveBeenCalled();
      expect(mockSocket.join).toHaveBeenCalledWith('new-session-id');
      expect(res).toEqual({
        event: 'joined',
        data: { sessionId: 'new-session-id' },
      });
    });

    it('should throw WsException if specified sessionId does not exist', async () => {
      prismaMock.liveChatSession.findUnique.mockResolvedValue(null);

      await expect(
        gateway.joinChat(
          { sessionId: 'invalid-session' },
          mockSocket as unknown as Socket,
        ),
      ).rejects.toThrow(WsException);
    });
  });

  describe('sendMessage', () => {
    it('should persist chat message and emit to room members', async () => {
      prismaMock.liveChatSession.findUnique.mockResolvedValue({
        id: 'sess-1',
      });
      prismaMock.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        sessionId: 'sess-1',
        senderType: 'CUSTOMER',
        senderId: 'c1',
        content: 'Hello agent',
        createdAt: new Date(),
      });

      const res = await gateway.sendMessage(
        {
          sessionId: 'sess-1',
          senderType: 'CUSTOMER',
          senderId: 'c1',
          content: 'Hello agent',
        },
        mockSocket as unknown as Socket,
      );

      expect(prismaMock.chatMessage.create).toHaveBeenCalled();
      expect(mockSocket.to).toHaveBeenCalledWith('sess-1');
      expect(res.event).toBe('messageSent');
    });
  });

  describe('agentTyping', () => {
    it('should broadcast typing status to room', async () => {
      await gateway.agentTyping(
        { sessionId: 'sess-1', isTyping: true },
        mockSocket as unknown as Socket,
      );

      expect(mockSocket.to).toHaveBeenCalledWith('sess-1');
    });
  });
});
