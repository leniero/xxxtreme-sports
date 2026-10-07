/**
 * Storefront config.
 *
 * Leave `storefrontAccessToken` empty to run on the built-in mock catalogue
 * (procedurally generated transparent "cutout" products) — handy while the
 * motion work is being designed before the Shopify store is ready.
 *
 * The Storefront API *public* token is designed to ship to the browser.
 * Never put an Admin API token here.
 */
export const environment = {
  shopify: {
    /** e.g. 'xxxtreme-sports.myshopify.com' */
    storeDomain: '',
    /** Public Storefront API token from the Headless sales channel */
    storefrontAccessToken: '',
    /** Shopify releases a new API version every quarter — bump when needed */
    apiVersion: '2026-07',
    /** Drives currency + translated content via @inContext */
    country: 'GB',
    language: 'EN',
  },
};
