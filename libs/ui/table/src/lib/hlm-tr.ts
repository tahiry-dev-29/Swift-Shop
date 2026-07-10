import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <tr> element
 * within an HlmTable context.
 */
@Directive({
  selector: 'tr[hlmTr],tr[hlmTableRow]',
  host: { 'data-slot': 'table-row' },
})
export class HlmTr {
  constructor() {
    classes(
      () =>
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors has-aria-expanded:bg-muted/50',
    );
  }
}
