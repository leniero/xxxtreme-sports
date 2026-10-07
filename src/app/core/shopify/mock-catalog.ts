import { Img, Product, Variant } from './types';

/**
 * Procedural placeholder catalogue: every product gets a seeded, transparent
 * SVG "cutout" blob so the cloud/collage behaves like it will with real
 * PNG cutouts. Delete once the Shopify store has products.
 */

const NAMES = [
  'Chrome Shin Guard', 'Mesh Halo Jersey', 'Rave Saint Puffer', 'Grip Tape Mini',
  'Neon Rot Tracksuit', 'Vapour Bra Top', 'Asphalt Kiss Boot', 'Sweatband Relic',
  'Hydro Veil Shell', 'Bruise Print Legging', 'Moth Collar Hoodie', 'Liquid Ankle Sock',
  'Stud Halo Cap', 'Static Bloom Corset',
];

const PALETTES: [string, string][] = [
  ['#d4ff3a', '#2b6b00'], ['#ff2e88', '#5a0030'], ['#c9ccd1', '#2a2d33'],
  ['#7af0ff', '#003a52'], ['#ff8a1f', '#5a1f00'], ['#b18cff', '#260a5c'],
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blobPath(rand: () => number, cx: number, cy: number, r: number, points = 9): string {
  const pts = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const rr = r * (0.62 + rand() * 0.38);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${mid(pts[points - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < points; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % points]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + 'Z';
}

function cutoutSvg(seed: number, label: string): Img {
  const rand = rng(seed);
  const [a, b] = PALETTES[seed % PALETTES.length];
  const w = 400;
  const h = Math.round(400 * (0.8 + rand() * 0.6));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>
<path d="${blobPath(rand, w / 2, h / 2, Math.min(w, h) * 0.46)}" fill="url(#g)"/>
<path d="${blobPath(rand, w / 2, h / 2, Math.min(w, h) * 0.46)}" fill="${a}" filter="url(#n)" opacity=".8"/>
<text x="50%" y="52%" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="#0b0b0c" letter-spacing="2">${label.toUpperCase()}</text>
</svg>`;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    altText: label,
    width: w,
    height: h,
  };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const MOCK_PRODUCTS: Product[] = NAMES.map((title, i) => {
  const rand = rng(i * 97 + 13);
  const price = (40 + Math.round(rand() * 26) * 10).toFixed(2);
  const money = { amount: price, currencyCode: 'GBP' };
  const img = cutoutSvg(i + 1, title.split(' ').at(-1) ?? title);
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const variants: Variant[] = sizes.map((size, s) => ({
    id: `gid://mock/ProductVariant/${i}-${s}`,
    title: size,
    availableForSale: rand() > 0.15,
    price: money,
    selectedOptions: [{ name: 'Size', value: size }],
    image: img,
  }));
  return {
    id: `gid://mock/Product/${i}`,
    handle: slug(title),
    title,
    description: 'Placeholder product from the mock catalogue. Connect Shopify in src/environments/environment.ts.',
    descriptionHtml:
      '<p>Placeholder product from the mock catalogue. Connect Shopify in <code>src/environments/environment.ts</code>.</p>',
    vendor: 'XXXtreme Sports',
    tags: [],
    featuredImage: img,
    images: [img],
    cutout: img,
    motion: { depth: rand(), spin: (rand() - 0.5) * 12, scale: 0.8 + rand() * 0.5 },
    options: [{ name: 'Size', values: sizes }],
    variants,
    priceRange: { min: money, max: money },
  };
});
