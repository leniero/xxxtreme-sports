import { describe, expect, it } from 'vitest';
import { MoneyPipe } from './core/money.pipe';
import { noise3 } from './motion/noise';
import { MOCK_PRODUCTS } from './core/shopify/mock-catalog';

describe('MoneyPipe', () => {
  it('formats GBP', () => {
    expect(new MoneyPipe().transform({ amount: '120.5', currencyCode: 'GBP' })).toBe('£120.50');
  });
});

describe('noise3', () => {
  it('is deterministic and bounded', () => {
    const a = noise3(1.3, 2.7, 0.4);
    expect(noise3(1.3, 2.7, 0.4)).toBe(a);
    expect(Math.abs(a)).toBeLessThanOrEqual(1.5);
  });
});

describe('mock catalogue', () => {
  it('has unique handles and variants', () => {
    const handles = new Set(MOCK_PRODUCTS.map((p) => p.handle));
    expect(handles.size).toBe(MOCK_PRODUCTS.length);
    expect(MOCK_PRODUCTS.every((p) => p.variants.length > 0)).toBe(true);
  });
});
