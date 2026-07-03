import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationToastComponent } from './notification-toast.component';
import { NotificationItem } from './notification.models';

const notification: NotificationItem = {
  id: 'notification-1',
  type: 'stock.low',
  channel: 'IN_APP',
  title: 'Low stock',
  body: 'A tracked item is nearly sold out.',
  readAt: null,
  dateAdd: '2026-06-30T10:00:00.000Z',
};

describe('NotificationToastComponent', () => {
  let fixture: ComponentFixture<NotificationToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationToastComponent);
  });

  it('does not render without a notification', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
  });

  it('emits dismissal and action selections', () => {
    const dismissed = vi.fn();
    const actionSelected = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    fixture.componentInstance.actionSelected.subscribe(actionSelected);
    fixture.componentRef.setInput('notification', notification);
    fixture.componentRef.setInput('actions', [
      { label: 'View', value: 'view' },
    ]);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons.item(0).click();
    buttons.item(1).click();

    expect(actionSelected).toHaveBeenCalledWith('view');
    expect(dismissed).toHaveBeenCalledWith('notification-1');
  });
});
