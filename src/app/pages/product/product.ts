import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe } from '../../core/money.pipe';
import { CatalogService } from '../../core/shopify/catalog.service';
import { MagneticDirective } from '../../motion/magnetic.directive';

@Component({
  selector: 'app-product-page',
  imports: [MoneyPipe, MagneticDirective, RouterLink],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class ProductPage {
  /** bound from the `:handle` route param (withComponentInputBinding) */
  readonly handle = input.required<string>();

  private readonly catalog = inject(CatalogService);
  protected readonly cart = inject(CartService);

  protected readonly product = resource({
    params: () => this.handle(),
    loader: ({ params }) => this.catalog.product(params),
  });

  /** Selected options, reset to the first variant whenever the product changes. */
  protected readonly selection = linkedSignal<Record<string, string>>(() => {
    const first = this.product.value()?.variants[0];
    return Object.fromEntries(first?.selectedOptions.map((o) => [o.name, o.value]) ?? []);
  });

  protected readonly variant = computed(() => {
    const sel = this.selection();
    return (
      this.product.value()?.variants.find((v) => v.selectedOptions.every((o) => sel[o.name] === o.value)) ?? null
    );
  });

  protected readonly hero = computed(() => {
    const p = this.product.value();
    return this.variant()?.image ?? p?.cutout ?? p?.featuredImage ?? null;
  });

  select(name: string, value: string): void {
    this.selection.update((s) => ({ ...s, [name]: value }));
  }

  addToBag(): void {
    const v = this.variant();
    if (v?.availableForSale) this.cart.add(v.id);
  }
}
