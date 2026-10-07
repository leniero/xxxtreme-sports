import { Component, inject, resource } from '@angular/core';
import { CatalogService } from '../../core/shopify/catalog.service';
import { ProductGrid } from '../../ui/product-grid/product-grid';

@Component({
  selector: 'app-shop',
  imports: [ProductGrid],
  template: `
    <h1>Everything</h1>
    @if (products.hasValue()) {
      <app-product-grid [products]="products.value()" />
    } @else if (products.error()) {
      <p>{{ products.error() }}</p>
    } @else {
      <p>loading…</p>
    }
  `,
  styles: `
    :host { display: block; padding: 110px 16px 80px; }
    h1 { font: 800 clamp(48px, 10vw, 140px)/.85 var(--font-display); letter-spacing: -.05em; margin: 0 0 40px; }
  `,
})
export class Shop {
  private readonly catalog = inject(CatalogService);
  protected readonly products = resource({ loader: () => this.catalog.products(100) });
}
