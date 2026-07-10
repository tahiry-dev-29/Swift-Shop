import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <tbody> element
 * within an HlmTable context.
 */
@Directive({
  selector: 'tbody[hlmTBody],tbody[hlmTableBody]',
  host: { 'data-slot': 'table-body' },
})
export class HlmTBody {
  constructor() {
    classes(() => '[&_tr:last-child]:border-0');
  }
}
