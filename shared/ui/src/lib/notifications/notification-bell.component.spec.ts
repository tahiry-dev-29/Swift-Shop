import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
  });

  it('caps large unread counts', () => {
    fixture.componentRef.setInput('unreadCount', 142);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('span');

    expect(badge?.textContent?.trim()).toBe('99+');
  });

  it('emits when toggled', () => {
    const spy = vi.fn();
    fixture.componentInstance.openedChangeRequested.subscribe(spy);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();

    expect(spy).toHaveBeenCalledOnce();
  });
});
