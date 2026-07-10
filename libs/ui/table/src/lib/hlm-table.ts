import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/**
 * Directive to apply Shadcn-like styling to a <table> element.
 */
@Directive({
  selector: 'table[hlmTable]',
  host: { 'data-slot': 'table' },
})
export class HlmTable {
  constructor() {
    classes(() => 'w-full caption-bottom text-sm');
  }
}
