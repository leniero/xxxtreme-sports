import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartDrawer } from './layout/cart-drawer/cart-drawer';
import { SiteHeader } from './layout/site-header/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, CartDrawer],
  template: `
    <app-site-header />
    <main>
      <router-outlet />
    </main>
    <app-cart-drawer />
  `,
})
export class App {}
