import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { MagneticDirective } from '../../motion/magnetic.directive';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, MagneticDirective],
  template: `
    <a routerLink="/" class="logo">XXX</a>
    <nav>
      <a routerLink="/shop">shop all</a>
      <button type="button" class="bag" appMagnetic="0.4" (click)="cart.toggle()">
        bag <span>{{ cart.count() }}</span>
      </button>
    </nav>
  `,
  styles: `
    :host {
      position: fixed; top: 0; left: 0; right: 0; z-index: 60;
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px; pointer-events: none;
      font: 600 12px var(--font-ui); text-transform: uppercase; letter-spacing: .1em;
      view-transition-name: site-header;
    }
    a, button { pointer-events: auto; color: var(--ink); text-decoration: none; }
    .logo { font: 800 28px var(--font-display); letter-spacing: -.06em; }
    nav { display: flex; gap: 16px; align-items: center; }
    .bag {
      display: inline-flex; gap: 8px; align-items: center;
      padding: 10px 16px; border: 1px solid var(--ink); border-radius: 999px;
      background: var(--paper); font: inherit; cursor: pointer;
    }
    .bag span { display: inline-grid; place-items: center; min-width: 20px; height: 20px; border-radius: 50%; background: var(--acid); }
  `,
})
export class SiteHeader {
  protected readonly cart = inject(CartService);
}
