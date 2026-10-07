import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoneyPipe } from '../../core/money.pipe';
import { Product } from '../../core/shopify/types';

/** Calm, accessible fallback (and the reduced-motion view). */
@Component({
  selector: 'app-product-grid',
  imports: [RouterLink, MoneyPipe],
  template: `
    <ul>
      @for (p of products(); track p.id) {
        <li>
          <a [routerLink]="['/p', p.handle]">
            <img [src]="(p.cutout ?? p.featuredImage)?.url" [alt]="p.title" loading="lazy" />
            <span class="t">{{ p.title }}</span>
            <span class="p">{{ p.priceRange.min | money }}</span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    :host { display: block; }
    ul { list-style: none; margin: 0 auto; padding: 0; max-width: 1400px;
      display: grid; gap: 32px 16px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
    a { display: grid; gap: 6px; color: inherit; text-decoration: none; }
    img { width: 100%; aspect-ratio: 1; object-fit: contain; transition: transform .4s cubic-bezier(.2,.9,.25,1.4); }
    a:hover img, a:focus-visible img { transform: scale(1.06) rotate(-3deg); }
    .t, .p { font: 600 11px var(--font-ui); text-transform: uppercase; letter-spacing: .06em; }
    .p { opacity: .6; }
  `,
})
export class ProductGrid {
  readonly products = input.required<Product[]>();
}
