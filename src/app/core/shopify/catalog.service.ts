import { Injectable, inject } from '@angular/core';
import { COMMERCE } from './commerce-backend';
import { Product } from './types';

/** Read-side of the store. Pair with Angular's `resource()` in components. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly backend = inject(COMMERCE);
  private readonly cache = new Map<string, Product>();

  get isMock(): boolean {
    return this.backend.kind === 'mock';
  }

  async products(first = 24): Promise<Product[]> {
    const list = await this.backend.products(first);
    list.forEach((p) => this.cache.set(p.handle, p));
    return list;
  }

  /** Served from cache first so the cloud → product view transition is instant. */
  async product(handle: string): Promise<Product | null> {
    const hit = this.cache.get(handle);
    if (hit) return hit;
    const p = await this.backend.product(handle);
    if (p) this.cache.set(handle, p);
    return p;
  }
}
