import { CommerceBackend } from './commerce-backend';
import { MOCK_PRODUCTS } from './mock-catalog';
import { Cart, CartLine, LineInput, LineUpdate, Product } from './types';

const KEY = 'xxx.mock-cart';
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** In-browser stand-in for Shopify. Same interface, fake latency. */
export class MockBackend implements CommerceBackend {
  readonly kind = 'mock' as const;

  async products(first = 24): Promise<Product[]> {
    await delay();
    return MOCK_PRODUCTS.slice(0, first);
  }

  async product(handle: string): Promise<Product | null> {
    await delay();
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  }

  async getCart(id: string): Promise<Cart | null> {
    const cart = this.load();
    return cart?.id === id ? cart : null;
  }

  async createCart(lines: LineInput[]): Promise<Cart> {
    const cart: Cart = {
      id: `gid://mock/Cart/${Date.now()}`,
      checkoutUrl: '',
      totalQuantity: 0,
      subtotal: { amount: '0', currencyCode: 'GBP' },
      lines: [],
    };
    return this.addTo(cart, lines);
  }

  async addLines(_cartId: string, lines: LineInput[]): Promise<Cart> {
    return this.addTo(this.load() ?? (await this.createCart([])), lines);
  }

  async updateLines(_cartId: string, updates: LineUpdate[]): Promise<Cart> {
    const cart = this.load()!;
    for (const u of updates) {
      const line = cart.lines.find((l) => l.id === u.id);
      if (line) line.quantity = u.quantity;
    }
    cart.lines = cart.lines.filter((l) => l.quantity > 0);
    return this.save(cart);
  }

  async removeLines(_cartId: string, ids: string[]): Promise<Cart> {
    const cart = this.load()!;
    cart.lines = cart.lines.filter((l) => !ids.includes(l.id));
    return this.save(cart);
  }

  private async addTo(cart: Cart, lines: LineInput[]): Promise<Cart> {
    await delay(150);
    for (const input of lines) {
      const existing = cart.lines.find((l) => l.merchandise.id === input.merchandiseId);
      if (existing) {
        existing.quantity += input.quantity;
        continue;
      }
      const product = MOCK_PRODUCTS.find((p) => p.variants.some((v) => v.id === input.merchandiseId));
      const variant = product?.variants.find((v) => v.id === input.merchandiseId);
      if (!product || !variant) continue;
      const line: CartLine = {
        id: `line-${input.merchandiseId}`,
        quantity: input.quantity,
        cost: variant.price,
        merchandise: {
          id: variant.id,
          title: variant.title,
          price: variant.price,
          image: variant.image,
          product: { handle: product.handle, title: product.title },
        },
      };
      cart.lines.push(line);
    }
    return this.save(cart);
  }

  private save(cart: Cart): Cart {
    let total = 0;
    for (const l of cart.lines) {
      const sum = Number(l.merchandise.price.amount) * l.quantity;
      l.cost = { amount: sum.toFixed(2), currencyCode: 'GBP' };
      total += sum;
    }
    cart.totalQuantity = cart.lines.reduce((n, l) => n + l.quantity, 0);
    cart.subtotal = { amount: total.toFixed(2), currencyCode: 'GBP' };
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable — cart lives in memory only */
    }
    return structuredClone(cart);
  }

  private load(): Cart | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Cart) : null;
    } catch {
      return null;
    }
  }
}
