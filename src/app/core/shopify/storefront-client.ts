import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Thin fetch wrapper around the Shopify Storefront GraphQL API. */
@Injectable({ providedIn: 'root' })
export class StorefrontClient {
  private readonly cfg = environment.shopify;

  get enabled(): boolean {
    return Boolean(this.cfg.storeDomain && this.cfg.storefrontAccessToken);
  }

  private get endpoint(): string {
    return `https://${this.cfg.storeDomain}/api/${this.cfg.apiVersion}/graphql.json`;
  }

  /**
   * Every operation declares `$country` / `$language` and uses `@inContext`,
   * so prices come back in the shopper's currency.
   */
  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': this.cfg.storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables: { country: this.cfg.country, language: this.cfg.language, ...variables },
      }),
    });

    if (!res.ok) throw new Error(`Storefront API ${res.status} ${res.statusText}`);

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
    if (!json.data) throw new Error('Storefront API returned no data');
    return json.data;
  }
}
