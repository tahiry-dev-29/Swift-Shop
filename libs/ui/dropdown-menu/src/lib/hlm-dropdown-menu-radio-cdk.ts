import { type BooleanInput } from '@angular/cdk/coercion';
import {
  CdkMenuItem,
  CdkMenuItemRadio,
  CdkMenuItemSelectable,
} from '@angular/cdk/menu';
import { Directive, booleanAttribute, input } from '@angular/core';

/** @internal. Use HlmDropdownMenuRadio instead. */
@Directive({
  selector: '[hlmDropdownMenuRadioCdk]',
  providers: [
    { provide: CdkMenuItemRadio, useExisting: HlmDropdownMenuRadioCdk },
    { provide: CdkMenuItemSelectable, useExisting: HlmDropdownMenuRadioCdk },
    { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
  ],
})
export class HlmDropdownMenuRadioCdk extends CdkMenuItemRadio {
  public readonly keepOpen = input<boolean, BooleanInput>(true, {
    transform: booleanAttribute,
  });

  public override trigger(options?: { keepOpen: boolean }) {
    super.trigger({ ...options, keepOpen: this.keepOpen() });
  }
}
