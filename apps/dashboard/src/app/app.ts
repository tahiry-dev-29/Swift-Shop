import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `<h1>Welcome dashboard</h1>
    <router-outlet></router-outlet>`,
  styles: ``,
})
export class App {}
