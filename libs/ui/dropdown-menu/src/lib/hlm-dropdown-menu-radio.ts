import { Directive, inject } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { HlmDropdownMenuFocusOnHover } from './hlm-dropdown-menu-focus-on-hover';
import { HlmDropdownMenuRadioCdk } from './hlm-dropdown-menu-radio-cdk';

@Directive({
  selector: '[hlmDropdownMenuRadio]',
  hostDirectives: [
    {
      directive: HlmDropdownMenuRadioCdk,
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
    'data-slot': 'dropdown-menu-radio-item',
    '[attr.data-disabled]': '_cdkMenuItem.disabled ? "" : null',
    '[attr.data-checked]': '_cdkMenuItem.checked ? "" : null',
  },
})
export class HlmDropdownMenuRadio {
  protected readonly _cdkMenuItem = inject(HlmDropdownMenuRadioCdk);

  constructor() {
    classes(
      () =>
        "hover:bg-accent focus:bg-accent hover:text-accent-foreground focus:text-accent-foreground hover:**:text-accent-foreground focus:**:text-accent-foreground gap-2.5 rounded-2xl py-2 ps-3 pe-8 text-sm font-medium data-inset:ps-9.5 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/dropdown-menu-radio relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
