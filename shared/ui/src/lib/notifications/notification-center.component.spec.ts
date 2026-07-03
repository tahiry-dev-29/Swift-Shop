import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationCenterComponent } from './notification-center.component';
import { NotificationItem } from './notification.models';

const notification: NotificationItem = {
  id: 'notification-1',
  type: 'order.shipped',
  channel: 'IN_APP',
  title: 'Order shipped',
  body: 'Your order is on the way.',
  readAt: null,
  dateAdd: '2026-06-30T10:00:00.000Z',
};

describe('NotificationCenterComponent', () => {
  let fixture: ComponentFixture<NotificationCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
  });

  it('renders the empty state', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No notifications');
  });

  it('emits mark read for unread notifications', () => {
    const spy = vi.fn();
    fixture.componentInstance.markRead.subscribe(spy);
    fixture.componentRef.setInput('notifications', [notification]);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons.item(2).click();

    expect(spy).toHaveBeenCalledWith('notification-1');
  });
});
