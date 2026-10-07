import { Pipe, PipeTransform } from '@angular/core';
import { Money } from './shopify/types';

const formatters = new Map<string, Intl.NumberFormat>();

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: Money | null | undefined, locale = 'en-GB'): string {
    if (!value) return '';
    const key = `${locale}|${value.currencyCode}`;
    let f = formatters.get(key);
    if (!f) {
      f = new Intl.NumberFormat(locale, { style: 'currency', currency: value.currencyCode });
      formatters.set(key, f);
    }
    return f.format(Number(value.amount));
  }
}
