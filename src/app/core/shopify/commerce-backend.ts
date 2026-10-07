import { InjectionToken, inject } from '@angular/core';
import { Cart, LineInput, LineUpdate, Product } from './types';
import { StorefrontClient } from './storefront-client';
import { ShopifyBackend } from './shopify-backend';
import { MockBackend } from './mock-backend';

/**
 * Everything the UI needs from commerce. Two implementations:
 *  - ShopifyBackend: real Storefront API (products, Cart API, hosted checkout)
 *  - MockBackend: local fake catalogue so design/motion work never blocks on data
 */
export interface CommerceBackend {
  readonly kind: 'shopify' | 'mock';
  products(first?: number): Promise<Product[]>;
  product(handle: string): Promise<Product | null>;
  getCart(id: string): Promise<Cart | null>;
  createCart(lines: LineInput[]): Promise<Cart>;
  addLines(cartId: string, lines: LineInput[]): Promise<Cart>;
  updateLines(cartId: string, lines: LineUpdate[]): Promise<Cart>;
  removeLines(cartId: string, lineIds: string[]): Promise<Cart>;
}

export const COMMERCE = new InjectionToken<CommerceBackend>('COMMERCE', {
  providedIn: 'root',
  factory: () => {
    const client = inject(StorefrontClient);
    return client.enabled ? new ShopifyBackend(client) : new MockBackend();
  },
});
