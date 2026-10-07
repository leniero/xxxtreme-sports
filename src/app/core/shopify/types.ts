/** Normalised domain types — components never see raw Storefront API shapes. */

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Img {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: SelectedOption[];
  image: Img | null;
}

/**
 * Per-product art direction, stored in Shopify as a JSON metafield
 * (`custom.motion`). Lets the brand team tune how each piece behaves
 * in the cloud/collage without touching code.
 */
export interface ProductMotion {
  /** 0 = far back, 1 = right in your face */
  depth?: number;
  /** degrees per second of idle spin */
  spin?: number;
  /** size multiplier in the cloud */
  scale?: number;
  /** CSS mix-blend-mode */
  blend?: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  tags: string[];
  featuredImage: Img | null;
  images: Img[];
  /** Transparent PNG/WebP cutout (metafield `custom.cutout`) — the collage asset */
  cutout: Img | null;
  motion: ProductMotion | null;
  options: { name: string; values: string[] }[];
  variants: Variant[];
  priceRange: { min: Money; max: Money };
}

export interface CartLine {
  id: string;
  quantity: number;
  cost: Money;
  merchandise: {
    id: string;
    title: string;
    price: Money;
    image: Img | null;
    product: { handle: string; title: string };
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  lines: CartLine[];
}

export interface LineInput {
  merchandiseId: string;
  quantity: number;
}

export interface LineUpdate {
  id: string;
  quantity: number;
}
