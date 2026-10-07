/**
 * GraphQL documents for the Storefront API.
 * Images are requested as WebP via `transform` — WebP keeps alpha, so
 * transparent PNG cutouts stay transparent and get much lighter.
 */

const CONTEXT_VARS = '$country: CountryCode, $language: LanguageCode';
const IN_CONTEXT = '@inContext(country: $country, language: $language)';

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image {
    url(transform: { maxWidth: 1400, preferredContentType: WEBP })
    altText
    width
    height
  }
`;

export const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    tags
    featuredImage { ...ImageFields }
    images(first: 12) { nodes { ...ImageFields } }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    options { name optionValues { name } }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
        image { ...ImageFields }
      }
    }
    cutout: metafield(namespace: "custom", key: "cutout") {
      reference { ... on MediaImage { image { ...ImageFields } } }
    }
    motion: metafield(namespace: "custom", key: "motion") { value }
  }
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            image { ...ImageFields }
            product { handle title }
          }
        }
      }
    }
  }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    products(first: $first, sortKey: BEST_SELLING) { nodes { ...ProductFields } }
  }
  ${PRODUCT_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

export const PRODUCT_QUERY = /* GraphQL */ `
  query Product($handle: String!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    product(handle: $handle) { ...ProductFields }
  }
  ${PRODUCT_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

const USER_ERRORS = 'userErrors { field message }';
const CART_TAIL = `${CART_FRAGMENT}\n${IMAGE_FRAGMENT}`;

export const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cart(id: $id) { ...CartFields }
  }
  ${CART_TAIL}
`;

export const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!], ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: $country } }) {
      cart { ...CartFields }
      ${USER_ERRORS}
    }
  }
  ${CART_TAIL}
`;

export const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_TAIL}
`;

export const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_TAIL}
`;

export const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_TAIL}
`;
