import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'support',
    loadChildren: () =>
      import('./features/support/support.routes').then((m) => m.supportRoutes),
  },
];
