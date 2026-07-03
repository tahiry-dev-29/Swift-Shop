import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'lib-notification-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
  template: `
    <button
      type="button"
      class="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-expanded]="expanded()"
      (click)="openedChangeRequested.emit()"
    >
      <i class="pi pi-bell text-base" aria-hidden="true"></i>
      @if (visibleCount() > 0) {
        <span
          class="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold leading-none text-white ring-2 ring-white"
          aria-hidden="true"
        >
          {{ countLabel() }}
        </span>
      }
    </button>
  `,
})
export class NotificationBellComponent {
  unreadCount = input(0);
  expanded = input(false);
  openedChangeRequested = output<void>();

  protected visibleCount = computed(() => Math.max(0, this.unreadCount()));
  protected countLabel = computed(() => {
    const count = this.visibleCount();
    return count > 99 ? '99+' : String(count);
  });
  protected ariaLabel = computed(() => {
    const count = this.visibleCount();
    return count === 1
      ? 'Open notifications, 1 unread'
      : `Open notifications, ${count} unread`;
  });
}
