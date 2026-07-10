import { type BooleanInput } from '@angular/cdk/coercion';
import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { HlmDropdownMenuCheckboxCdk } from './hlm-dropdown-menu-checkbox-cdk';
import { HlmDropdownMenuFocusOnHover } from './hlm-dropdown-menu-focus-on-hover';

@Directive({
  selector: '[hlmDropdownMenuCheckbox],[hlmDropdownMenuCheckboxItem]',
  hostDirectives: [
    {
      directive: HlmDropdownMenuCheckboxCdk,
      inputs: [
        'cdkMenuItemDisabled: disabled',
        'cdkMenuItemChecked: checked',
        'keepOpen',
      ],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
    HlmDropdownMenuFocusOnHover,
  ],
  host: {
    'data-slot': 'dropdown-menu-checkbox-item',
    '[attr.data-disabled]': '_cdkMenuItem.disabled ? "" : null',
    '[attr.data-checked]': '_cdkMenuItem.checked ? "" : null',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class HlmDropdownMenuCheckbox {
  protected readonly _cdkMenuItem = inject(HlmDropdownMenuCheckboxCdk);

  public readonly inset = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  constructor() {
    classes(
      () =>
        "hover:bg-accent focus:bg-accent hover:text-accent-foreground focus:text-accent-foreground hover:**:text-accent-foreground focus:**:text-accent-foreground gap-2.5 rounded-2xl py-2 ps-3 pe-8 text-sm font-medium data-inset:ps-9.5 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/dropdown-menu-checkbox relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
