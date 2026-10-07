import { Injectable, computed, inject, signal } from '@angular/core';
import { COMMERCE } from '../shopify/commerce-backend';
import { Cart } from '../shopify/types';

const CART_ID_KEY = 'xxx.cart-id';

/**
 * Cart state as signals. Uses Shopify's Cart API; checkout is always
 * Shopify-hosted (cart.checkoutUrl) — that's the one part of the
 * journey a headless storefront can't replace.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly backend = inject(COMMERCE);

  readonly cart = signal<Cart | null>(null);
  readonly isOpen = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly count = computed(() => this.cart()?.totalQuantity ?? 0);

  constructor() {
    const id = this.readId();
    if (id) {
      this.backend
        .getCart(id)
        .then((c) => (c ? this.cart.set(c) : this.writeId(null)))
        .catch(() => this.writeId(null));
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  add(merchandiseId: string, quantity = 1): Promise<void> {
    return this.run(async () => {
      const current = this.cart();
      const lines = [{ merchandiseId, quantity }];
      const next = current
        ? await this.backend.addLines(current.id, lines)
        : await this.backend.createCart(lines);
      this.commit(next);
      this.open();
    });
  }

  setQuantity(lineId: string, quantity: number): Promise<void> {
    const cart = this.cart();
    if (!cart) return Promise.resolve();
    if (quantity <= 0) return this.remove(lineId);
    return this.run(async () => this.commit(await this.backend.updateLines(cart.id, [{ id: lineId, quantity }])));
  }

  remove(lineId: string): Promise<void> {
    const cart = this.cart();
    if (!cart) return Promise.resolve();
    return this.run(async () => this.commit(await this.backend.removeLines(cart.id, [lineId])));
  }

  checkout(): void {
    const url = this.cart()?.checkoutUrl;
    if (this.backend.kind === 'mock' || !url) {
      this.error.set('Mock mode — connect Shopify to reach checkout.');
      return;
    }
    window.location.href = url;
  }

  private commit(cart: Cart): void {
    this.cart.set(cart);
    this.writeId(cart.id);
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await fn();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  private readId(): string | null {
    try {
      return localStorage.getItem(CART_ID_KEY);
    } catch {
      return null;
    }
  }

  private writeId(id: string | null): void {
    try {
      if (id) localStorage.setItem(CART_ID_KEY, id);
      else localStorage.removeItem(CART_ID_KEY);
    } catch {
      /* ignore */
    }
  }
}
