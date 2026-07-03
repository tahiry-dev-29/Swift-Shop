import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationItem } from './notification.models';

@Component({
  selector: 'lib-notification-center',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <section
      class="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      aria-label="Notification center"
    >
      <header
        class="flex items-center justify-between border-b border-slate-200 px-4 py-3"
      >
        <div>
          <h2 class="text-sm font-semibold text-slate-950">Notifications</h2>
          <p class="text-xs text-slate-500">{{ unreadLabel() }}</p>
        </div>
        <button
          type="button"
          class="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          [disabled]="unreadCount() === 0"
          [class.opacity-40]="unreadCount() === 0"
          (click)="markAllRead.emit()"
        >
          Mark all read
        </button>
      </header>

      @if (notifications().length > 0) {
        <ul class="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
          @for (notification of notifications(); track notification.id) {
            <li
              class="grid grid-cols-[0.75rem_1fr_auto] gap-3 px-4 py-3 transition hover:bg-slate-50"
              [class.bg-emerald-50]="!notification.readAt"
            >
              <span
                class="mt-1 h-2.5 w-2.5 rounded-full"
                [class.bg-emerald-600]="!notification.readAt"
                [class.bg-slate-300]="notification.readAt"
                aria-hidden="true"
              ></span>
              <button
                type="button"
                class="min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                (click)="selected.emit(notification)"
              >
                <span
                  class="block truncate text-sm font-semibold text-slate-950"
                >
                  {{ notification.title }}
                </span>
                <span
                  class="mt-1 line-clamp-2 block text-sm leading-5 text-slate-600"
                >
                  {{ notification.body }}
                </span>
                <time class="mt-2 block text-xs text-slate-500">
                  {{ notification.dateAdd | date: 'medium' }}
                </time>
              </button>
              @if (!notification.readAt) {
                <button
                  type="button"
                  class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label="Mark notification as read"
                  (click)="markRead.emit(notification.id)"
                >
                  <i class="pi pi-check text-sm" aria-hidden="true"></i>
                </button>
              }
            </li>
          }
        </ul>
      } @else {
        <div class="px-6 py-10 text-center">
          <i class="pi pi-inbox text-2xl text-slate-400" aria-hidden="true"></i>
          <p class="mt-3 text-sm font-medium text-slate-800">
            No notifications
          </p>
          <p class="mt-1 text-sm text-slate-500">
            New updates will appear here.
          </p>
        </div>
      }
    </section>
  `,
})
export class NotificationCenterComponent {
  notifications = input<NotificationItem[]>([]);
  selected = output<NotificationItem>();
  markRead = output<string>();
  markAllRead = output<void>();

  protected unreadCount = computed(
    () =>
      this.notifications().filter((notification) => !notification.readAt)
        .length,
  );
  protected unreadLabel = computed(() => {
    const count = this.unreadCount();
    return count === 1 ? '1 unread update' : `${count} unread updates`;
  });
}
