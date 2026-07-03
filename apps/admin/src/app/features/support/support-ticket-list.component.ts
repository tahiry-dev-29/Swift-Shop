import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SupportService } from './support.service';

@Component({
  selector: 'app-support-ticket-list',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Support Tickets</h1>
      </div>

      @if (supportService.ticketsResource.isLoading()) {
        <div class="flex justify-center p-8 text-gray-500">
          <i class="pi pi-spin pi-spinner text-3xl"></i>
          <span class="ml-3">Loading tickets...</span>
        </div>
      }

      @if (supportService.ticketsResource.value(); as tickets) {
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
        >
          <p-table
            [value]="tickets"
            [paginator]="true"
            [rows]="10"
            responsiveLayout="scroll"
            styleClass="p-datatable-striped"
          >
            <ng-template pTemplate="header">
              <tr>
                <th
                  class="font-semibold text-sm text-gray-600 bg-gray-50 p-4 border-b"
                >
                  Reference
                </th>
                <th
                  class="font-semibold text-sm text-gray-600 bg-gray-50 p-4 border-b"
                >
                  Subject
                </th>
                <th
                  class="font-semibold text-sm text-gray-600 bg-gray-50 p-4 border-b"
                >
                  Status
                </th>
                <th
                  class="font-semibold text-sm text-gray-600 bg-gray-50 p-4 border-b"
                >
                  Priority
                </th>
                <th
                  class="font-semibold text-sm text-gray-600 bg-gray-50 p-4 border-b"
                >
                  Created
                </th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ticket>
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-4 border-b text-sm font-medium text-gray-900">
                  {{ ticket.reference }}
                </td>
                <td class="p-4 border-b text-sm text-gray-700">
                  {{ ticket.subject }}
                </td>
                <td class="p-4 border-b">
                  <p-tag
                    [value]="ticket.status"
                    [severity]="getSeverity(ticket.status)"
                    styleClass="text-xs"
                  ></p-tag>
                </td>
                <td class="p-4 border-b text-sm text-gray-700">
                  {{ ticket.priority }}
                </td>
                <td class="p-4 border-b text-sm text-gray-500">
                  {{ ticket.createdAt | date: 'mediumDate' }}
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="p-8 text-center text-gray-500">
                  No support tickets found.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
  `,
})
export class SupportTicketListComponent {
  public supportService = inject(SupportService);

  getSeverity(
    status: string,
  ):
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'secondary'
    | 'contrast'
    | undefined {
    switch (status) {
      case 'OPEN':
        return 'info';
      case 'IN_PROGRESS':
        return 'warn';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'secondary';
      default:
        return 'info';
    }
  }
}
