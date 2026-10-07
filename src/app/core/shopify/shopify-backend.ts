/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommerceBackend } from './commerce-backend';
import { StorefrontClient } from './storefront-client';
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_QUERY,
} from './queries';
import { Cart, LineInput, LineUpdate, Product, ProductMotion } from './types';

interface CartPayload {
  cart: any | null;
  userErrors: { field: string[] | null; message: string }[];
}

export class ShopifyBackend implements CommerceBackend {
  readonly kind = 'shopify' as const;

  constructor(private readonly client: StorefrontClient) {}

  async products(first = 24): Promise<Product[]> {
    const data = await this.client.request<{ products: { nodes: any[] } }>(PRODUCTS_QUERY, { first });
    return data.products.nodes.map(mapProduct);
  }

  async product(handle: string): Promise<Product | null> {
    const data = await this.client.request<{ product: any | null }>(PRODUCT_QUERY, { handle });
    return data.product ? mapProduct(data.product) : null;
  }

  async getCart(id: string): Promise<Cart | null> {
    const data = await this.client.request<{ cart: any | null }>(CART_QUERY, { id });
    return data.cart ? mapCart(data.cart) : null;
  }

  async createCart(lines: LineInput[]): Promise<Cart> {
    const d = await this.client.request<{ cartCreate: CartPayload }>(CART_CREATE, { lines });
    return unwrap(d.cartCreate);
  }

  async addLines(cartId: string, lines: LineInput[]): Promise<Cart> {
    const d = await this.client.request<{ cartLinesAdd: CartPayload }>(CART_LINES_ADD, { cartId, lines });
    return unwrap(d.cartLinesAdd);
  }

  async updateLines(cartId: string, lines: LineUpdate[]): Promise<Cart> {
    const d = await this.client.request<{ cartLinesUpdate: CartPayload }>(CART_LINES_UPDATE, { cartId, lines });
    return unwrap(d.cartLinesUpdate);
  }

  async removeLines(cartId: string, lineIds: string[]): Promise<Cart> {
    const d = await this.client.request<{ cartLinesRemove: CartPayload }>(CART_LINES_REMOVE, { cartId, lineIds });
    return unwrap(d.cartLinesRemove);
  }
}

function unwrap(payload: CartPayload): Cart {
  if (payload.userErrors?.length) throw new Error(payload.userErrors.map((e) => e.message).join('; '));
  if (!payload.cart) throw new Error('Cart mutation returned no cart');
  return mapCart(payload.cart);
}

function parseMotion(value: string | undefined): ProductMotion | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as ProductMotion;
  } catch {
    return null;
  }
}

function mapProduct(n: any): Product {
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    description: n.description ?? '',
    descriptionHtml: n.descriptionHtml ?? '',
    vendor: n.vendor ?? '',
    tags: n.tags ?? [],
    featuredImage: n.featuredImage ?? null,
    images: n.images?.nodes ?? [],
    cutout: n.cutout?.reference?.image ?? null,
    motion: parseMotion(n.motion?.value),
    options: (n.options ?? []).map((o: any) => ({
      name: o.name,
      values: (o.optionValues ?? []).map((v: any) => v.name),
    })),
    variants: n.variants?.nodes ?? [],
    priceRange: { min: n.priceRange.minVariantPrice, max: n.priceRange.maxVariantPrice },
  };
}

function mapCart(c: any): Cart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: c.cost.subtotalAmount,
    lines: (c.lines?.nodes ?? []).map((l: any) => ({
      id: l.id,
      quantity: l.quantity,
      cost: l.cost.totalAmount,
      merchandise: l.merchandise,
    })),
  };
}
