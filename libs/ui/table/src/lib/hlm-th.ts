import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <th> element
 * within an HlmTable context.
 */
@Directive({
  selector: 'th[hlmTh],th[hlmTableHead]',
  host: { 'data-slot': 'table-head' },
})
export class HlmTh {
  constructor() {
    classes(
      () =>
        'text-foreground h-12 px-3 text-start align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pe-0',
    );
  }
}
