import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <td> element
 * within an HlmTable context.
 */
@Directive({
  selector: 'td[hlmTd],td[hlmTableCell]',
  host: { 'data-slot': 'table-cell' },
})
export class HlmTd {
  constructor() {
    classes(
      () => 'p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0',
    );
  }
}
