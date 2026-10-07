# XXXtreme Sports — headless Shopify × Angular 22

An experimental storefront: products drift in a throwable cloud, a layered
transparent collage parallaxes around them, and clicking a product morphs it
into its page. Shopify does the commerce underneath: catalogue, cart, checkout,
payments, tax and orders.

```
npm install
npm start          # http://localhost:4200 (runs on the mock catalogue until Shopify is connected)
npm run build
npm test           # Vitest
```

---

## Architecture

```
src/
├─ environments/environment.ts      ← Shopify domain + public token (empty = mock mode)
├─ app/
│  ├─ core/
│  │  ├─ shopify/
│  │  │  ├─ storefront-client.ts    fetch wrapper for the Storefront GraphQL API
│  │  │  ├─ queries.ts              products, product, Cart API mutations
│  │  │  ├─ commerce-backend.ts     interface + DI token (picks Shopify or Mock)
│  │  │  ├─ shopify-backend.ts      real implementation
│  │  │  ├─ mock-backend.ts         fake store with the same interface
│  │  │  ├─ mock-catalog.ts         procedural transparent "cutout" products
│  │  │  └─ catalog.service.ts      read API used by pages (with cache)
│  │  ├─ cart/cart.service.ts       cart as signals → Shopify-hosted checkout
│  │  └─ money.pipe.ts
│  ├─ motion/                       ← the creative engine
│  │  ├─ frame-loop.service.ts      ONE shared rAF clock, sleeps when hidden, reduced-motion aware
│  │  ├─ pointer.service.ts         global pointer pos / velocity (plain fields, no CD)
│  │  ├─ noise.ts                   3D Perlin noise for flow fields
│  │  ├─ product-cloud/             physics cloud: flow field + springs + repel + drag/fling
│  │  ├─ collage-stage/             parallax layers of PNG/SVG/alpha-video, GSAP intro
│  │  ├─ alpha-video/               transparent video (WebM VP9 / HEVC for Safari)
│  │  └─ magnetic.directive.ts
│  ├─ layout/ (site-header, cart-drawer)
│  ├─ ui/product-grid/              calm accessible grid (also the reduced-motion view)
│  └─ pages/ (home, shop, product)
└─ public/collage/                  placeholder SVG collage pieces → replace with brand assets
```

**Motion rule:** anything that changes every frame writes straight to
`element.style.transform` inside a `FrameLoop` callback. It never goes into a
signal, because signals trigger change detection and you don't want that 60 times a
second. Signals are for UI state: cart, view mode, selected size.

**Angular 22 features used:** zoneless, signals, `resource()`, `linkedSignal`,
`input()`, route-param → input binding, `afterRenderEffect`, native View
Transitions (`withViewTransitions`), lazy routes, Vitest.

---

## Connecting Shopify

1. In Shopify admin, install the **Headless** sales channel and create a storefront.
2. Copy the **public** Storefront API access token. Never use an Admin token in the browser.
3. Fill in `src/environments/environment.ts`:
   ```ts
   storeDomain: 'xxxtreme-sports.myshopify.com',
   storefrontAccessToken: '…',
   ```
4. Publish products to the Headless channel. Unpublished products won't come back.
5. **Cutout metafield** (optional, recommended): Settings → Custom data → Products →
   add `custom.cutout` (type *File → Image*) and tick **Storefronts** access.
   Upload a transparent PNG per product. The cloud uses it in place of the
   flat product shot. PNGs come back as alpha-preserving WebP automatically.
6. **Motion metafield** (optional): `custom.motion`, type *JSON*, Storefronts access, e.g.
   `{"depth":0.9,"spin":12,"scale":1.3,"blend":"multiply"}`.
   Lets the brand team art-direct each product's behaviour from the admin.

Checkout is always Shopify's hosted checkout (`cart.checkoutUrl`). Point a
`checkout.` subdomain at it in Shopify → Domains so it feels continuous.

---

## How experimental can a Shopify shop get?

| Layer | Freedom | Notes |
|---|---|---|
| Browsing, product pages, cart UI | **Total** | It's our own front end. WebGL, physics, video, sound, generative anything. |
| Product data | High | Metafields and metaobjects can carry any art-direction data: motion params, 3D models, audio, collage sets per drop. |
| Cart | High | Cart API is fully custom-UI. Add from anywhere (drag-to-bag, collect-to-buy). |
| Checkout | **Low** | Shopify-hosted. Branding (colours, fonts, logo) via Checkout settings; deeper changes need Shopify Plus + Checkout Extensibility. |
| Accounts | Medium | Customer Account API (hosted login), or build custom flows. |

Guard-rails to keep it selling:
- Every product in the cloud is a real `<a>` (keyboard, screen readers, cmd-click, SEO-crawlable links).
- `prefers-reduced-motion` switches to the grid and kills the loop.
- The grid toggle is always there for people who just want to buy socks.
- Animations pause when the tab is hidden; alpha videos pause off-screen.

---

## Transparent assets

**Images:** PNG/WebP with alpha, or SVG. Drop into `public/collage/` and list in
`pages/home/home.ts` (`back` / `front` layers).

**Video:** export ProRes 4444 with alpha from After Effects / TouchDesigner / Blender, then:

```bash
# Chrome / Firefox / Edge
ffmpeg -i in.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -an out.webm
# Safari (run on a Mac — uses VideoToolbox)
ffmpeg -i in.mov -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.75 -tag:v hvc1 -an out.mov
```

```ts
{ kind: 'video', src: 'collage/smoke.webm', hevc: 'collage/smoke.mov', x: 50, y: 40, w: 30, depth: 0.6 }
```

---

## Ideas / next experiments

- **WebGL cloud**: move the products to Three.js / OGL sprites for hundreds of items, shader distortion, liquid hover.
- **Drag-to-bag**: drop a flung product onto the bag button to add it.
- **Drop mode**: a metaobject per drop holds its collage layers, so each release reshapes the homepage with no deploy.
- **Sound**: Web Audio tied to pointer velocity / collisions.
- **SSR / prerender** (`ng add @angular/ssr`) for SEO on product pages, once the look settles.
