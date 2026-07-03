import { Routes } from '@angular/router';
import { SupportTicketListComponent } from './support-ticket-list.component';

export const supportRoutes: Routes = [
  {
    path: '',
    component: SupportTicketListComponent,
    title: 'Support Tickets',
  },
];
