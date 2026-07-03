import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  senderType: 'CUSTOMER' | 'EMPLOYEE' | 'SYSTEM';
  content: string;
  createdAt: Date;
}

@Component({
  selector: 'app-live-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50">
      @if (isOpen()) {
        <div
          class="bg-white w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 transition-all"
        >
          <div
            class="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-400"></div>
              <h3 class="font-bold text-sm">Live Support</h3>
            </div>
            <button
              (click)="toggleChat()"
              class="text-white/80 hover:text-white transition-colors"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div
            class="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3"
          >
            @for (msg of messages(); track msg.id) {
              <div
                [ngClass]="{
                  'self-end': msg.senderType === 'CUSTOMER',
                  'self-start': msg.senderType !== 'CUSTOMER',
                }"
                class="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm"
                [class.bg-blue-600]="msg.senderType === 'CUSTOMER'"
                [class.text-white]="msg.senderType === 'CUSTOMER'"
                [class.bg-white]="msg.senderType !== 'CUSTOMER'"
                [class.text-gray-800]="msg.senderType !== 'CUSTOMER'"
              >
                {{ msg.content }}
              </div>
            }
            @if (agentTyping()) {
              <div
                class="self-start text-xs text-gray-500 italic bg-transparent"
              >
                Agent is typing...
              </div>
            }
          </div>

          <div class="p-3 bg-white border-t border-gray-100">
            <div class="relative flex items-center">
              <input
                type="text"
                [(ngModel)]="newMessage"
                (keyup.enter)="sendMessage()"
                placeholder="Type a message..."
                class="w-full bg-gray-100 text-sm rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button
                (click)="sendMessage()"
                class="absolute right-2 text-blue-600 hover:text-blue-700 transition-colors p-1"
                [disabled]="!newMessage.trim()"
              >
                <i class="pi pi-send"></i>
              </button>
            </div>
          </div>
        </div>
      } @else {
        <button
          (click)="toggleChat()"
          class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <i class="pi pi-comments text-2xl"></i>
        </button>
      }
    </div>
  `,
})
export class LiveChatWidgetComponent implements OnInit, OnDestroy {
  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  agentTyping = signal(false);
  newMessage = '';

  private socket!: Socket;

  ngOnInit() {
    this.socket = io('http://localhost:3000/live-chat', {
      autoConnect: false,
    });

    this.socket.on('messageReceived', (message: ChatMessage) => {
      this.messages.update((msgs) => [...msgs, message]);
    });

    this.socket.on('agentTyping', (isTyping: boolean) => {
      this.agentTyping.set(isTyping);
    });
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  toggleChat() {
    this.isOpen.update((v) => !v);
    if (this.isOpen() && !this.socket.connected) {
      this.socket.connect();
      this.socket.emit('joinChat', { customerId: 'current-user-id' });

      if (this.messages().length === 0) {
        this.messages.set([
          {
            id: '1',
            senderType: 'SYSTEM',
            content: 'Welcome to Live Support! How can we help you today?',
            createdAt: new Date(),
          },
        ]);
      }
    }
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        senderType: 'CUSTOMER',
        content: this.newMessage,
        createdAt: new Date(),
      };

      this.messages.update((msgs) => [...msgs, msg]);
      this.socket.emit('sendMessage', { content: this.newMessage });
      this.newMessage = '';
    }
  }
}
