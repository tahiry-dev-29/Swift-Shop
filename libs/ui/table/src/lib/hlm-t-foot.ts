import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <tfoot> element
 * within an HlmTable context.
 */
@Directive({
  selector: 'tfoot[hlmTFoot],tfoot[hlmTableFooter]',
  host: { 'data-slot': 'table-footer' },
})
export class HlmTFoot {
  constructor() {
    classes(() => 'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0');
  }
}
