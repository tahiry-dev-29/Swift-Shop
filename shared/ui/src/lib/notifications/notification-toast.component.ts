import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  NotificationAction,
  NotificationItem,
  NotificationTone,
} from './notification.models';

@Component({
  selector: 'lib-notification-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    @if (notification(); as item) {
      <aside
        class="grid w-full max-w-sm grid-cols-[0.75rem_1fr_auto] gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
        [class.border-emerald-200]="tone() === 'success'"
        [class.border-amber-200]="tone() === 'warning'"
        [class.border-rose-200]="tone() === 'danger'"
        role="status"
        aria-live="polite"
      >
        <span
          class="mt-1 h-2.5 w-2.5 rounded-full"
          [class.bg-sky-600]="tone() === 'info'"
          [class.bg-emerald-600]="tone() === 'success'"
          [class.bg-amber-500]="tone() === 'warning'"
          [class.bg-rose-600]="tone() === 'danger'"
          aria-hidden="true"
        ></span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-950">
            {{ item.title }}
          </p>
          <p class="mt-1 line-clamp-3 text-sm leading-5 text-slate-600">
            {{ item.body }}
          </p>
          @if (actions().length > 0) {
            <div class="mt-3 flex flex-wrap gap-2">
              @for (action of actions(); track action.value) {
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  (click)="actionSelected.emit(action.value)"
                >
                  {{ action.label }}
                </button>
              }
            </div>
          }
        </div>
        <button
          type="button"
          class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Dismiss notification"
          (click)="dismissed.emit(item.id)"
        >
          <i class="pi pi-times text-sm" aria-hidden="true"></i>
        </button>
      </aside>
    }
  `,
})
export class NotificationToastComponent {
  notification = input<NotificationItem | null>(null);
  tone = input<NotificationTone>('info');
  actions = input<NotificationAction[]>([]);
  dismissed = output<string>();
  actionSelected = output<string>();
}
