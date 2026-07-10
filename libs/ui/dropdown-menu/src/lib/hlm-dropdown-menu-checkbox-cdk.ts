import { type BooleanInput } from '@angular/cdk/coercion';
import {
  CdkMenuItem,
  CdkMenuItemCheckbox,
  CdkMenuItemSelectable,
} from '@angular/cdk/menu';
import { Directive, booleanAttribute, input } from '@angular/core';

/** @internal. Use HlmDropdownMenuCheckbox instead. */
@Directive({
  selector: '[hlmDropdownMenuCheckboxCdk]',
  providers: [
    { provide: CdkMenuItemCheckbox, useExisting: HlmDropdownMenuCheckboxCdk },
    { provide: CdkMenuItemSelectable, useExisting: HlmDropdownMenuCheckboxCdk },
    { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
  ],
})
export class HlmDropdownMenuCheckboxCdk extends CdkMenuItemCheckbox {
  public readonly keepOpen = input<boolean, BooleanInput>(true, {
    transform: booleanAttribute,
  });

  public override trigger(options?: { keepOpen: boolean }) {
    super.trigger({ ...options, keepOpen: this.keepOpen() });
  }
}
