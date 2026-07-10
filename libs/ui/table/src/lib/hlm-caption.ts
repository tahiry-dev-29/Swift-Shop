import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <caption> element
 * within an HlmTable context.
 */
@Directive({
  selector: 'caption[hlmCaption],caption[hlmTableCaption]',
  host: { 'data-slot': 'table-caption' },
})
export class HlmCaption {
  constructor() {
    classes(() => 'text-muted-foreground mt-4 text-sm');
  }
}
