import { Injectable, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SupportTicket {
  id: string;
  reference: string;
  subject: string;
  status: string;
  priority: string;
  dateAdd: string;
  customer?: { id: string; email: string };
}

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);

  ticketsResource = resource<SupportTicket[], void>({
    loader: async () => {
      const query = `
        query {
          supportTickets {
            id
            reference
            subject
            status
            priority
            dateAdd
          }
        }
      `;
      const response = await firstValueFrom(
        this.http.post<{ data: { supportTickets: SupportTicket[] } }>(
          '/graphql',
          { query },
        ),
      );
      return response?.data?.supportTickets ?? [];
    },
  });
}
