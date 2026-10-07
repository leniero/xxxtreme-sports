import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  input,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { MoneyPipe } from '../../core/money.pipe';
import { Product } from '../../core/shopify/types';
import { FrameLoop } from '../frame-loop.service';
import { Pointer } from '../pointer.service';
import { clamp, mix, noise3 } from '../noise';

interface Body {
  el: HTMLElement;
  x: number; y: number;
  vx: number; vy: number;
  /** home anchor the body is softly sprung to */
  hx: number; hy: number;
  r: number;
  seed: number;
  depth: number;
  spin: number;
  spinAcc: number;
  k: number;
  s: number;
  z: number;
  hover: boolean;
  grabbed: boolean;
  zIndex: number;
  blur: number;
}

interface Grab {
  body: Body;
  pointerId: number;
  ox: number; oy: number;
  lastX: number; lastY: number; lastT: number;
  moved: number;
}

/**
 * A drifting, throwable cloud of products.
 *
 * Physics per body, every frame:
 *   flow field (3D noise)  → organic drift
 *   spring to home anchor  → the cloud keeps its shape
 *   pointer repulsion+wind → products part around the cursor
 *   separation             → no pile-ups
 *   soft walls             → stays in frame
 * Products are real <a> links (keyboard/screen-reader friendly) and can be
 * grabbed and flung. Clicking morphs into the product page via the
 * View Transitions API.
 */
@Component({
  selector: 'app-product-cloud',
  imports: [MoneyPipe],
  templateUrl: './product-cloud.html',
  styleUrl: './product-cloud.scss',
  host: {
    '(pointermove)': 'dragMove($event)',
    '(pointerup)': 'dragEnd($event)',
    '(pointercancel)': 'dragEnd($event)',
  },
})
export class ProductCloud {
  readonly products = input.required<Product[]>();
  /** 0 = calm, 1 = default, 2+ = storm */
  readonly turbulence = input(1);
  /** Blur products that drift to the back. Pretty, but costs GPU. */
  readonly depthBlur = input(true);
  /** How hard the cursor pushes products away (0 disables). */
  readonly repel = input(1);

  private readonly items = viewChildren<ElementRef<HTMLElement>>('item');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly loop = inject(FrameLoop);
  private readonly pointer = inject(Pointer);
  private readonly router = inject(Router);

  private readonly byEl = new WeakMap<HTMLElement, Body>();
  private bodies: Body[] = [];
  private width = 0;
  private height = 0;
  private rect = { left: 0, top: 0 };
  private grab: Grab | null = null;
  private suppressClick = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // (Re)build physics bodies whenever the rendered product list changes.
    afterRenderEffect(() => this.sync(this.items().map((r) => r.nativeElement)));

    afterNextRender(() => {
      const ro = new ResizeObserver(([entry]) => {
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;
        this.layoutHomes();
      });
      ro.observe(this.host);
      const stop = this.loop.add((t, dt) => this.step(t, dt));
      destroyRef.onDestroy(() => {
        ro.disconnect();
        stop();
      });
    });
  }

  // ───────────────────────────────── template handlers

  setHover(i: number, on: boolean): void {
    const b = this.bodies[i];
    if (b) b.hover = on;
  }

  dragStart(e: PointerEvent, i: number): void {
    if (e.button !== 0) return;
    const b = this.bodies[i];
    if (!b) return;
    const { x, y } = this.local(e);
    b.grabbed = true;
    this.grab = { body: b, pointerId: e.pointerId, ox: b.x - x, oy: b.y - y, lastX: x, lastY: y, lastT: e.timeStamp, moved: 0 };
    b.el.setPointerCapture(e.pointerId);
    e.preventDefault(); // stop native link/image drag
  }

  dragMove(e: PointerEvent): void {
    const g = this.grab;
    if (!g || e.pointerId !== g.pointerId) return;
    const { x, y } = this.local(e);
    const dt = Math.max((e.timeStamp - g.lastT) / 1000, 1 / 240);
    const b = g.body;
    b.vx = mix(b.vx, (x - g.lastX) / dt, 0.5);
    b.vy = mix(b.vy, (y - g.lastY) / dt, 0.5);
    b.x = x + g.ox;
    b.y = y + g.oy;
    g.moved += Math.hypot(x - g.lastX, y - g.lastY);
    g.lastX = x;
    g.lastY = y;
    g.lastT = e.timeStamp;
  }

  dragEnd(e: PointerEvent): void {
    const g = this.grab;
    if (!g || e.pointerId !== g.pointerId) return;
    g.body.grabbed = false;
    g.body.vx = clamp(g.body.vx, -3000, 3000);
    g.body.vy = clamp(g.body.vy, -3000, 3000);
    this.suppressClick = g.moved > 6;
    this.grab = null;
  }

  open(e: MouseEvent, p: Product, i: number): void {
    if (this.suppressClick) {
      e.preventDefault();
      this.suppressClick = false;
      return;
    }
    // let cmd/ctrl-click open a new tab as normal
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const el = this.bodies[i]?.el;
    // Only the clicked product carries the shared name → it morphs into the PDP hero.
    if (el) el.style.viewTransitionName = 'product-hero';
    this.router.navigate(['/p', p.handle]);
  }

  // ───────────────────────────────── simulation

  private sync(els: HTMLElement[]): void {
    const products = this.products();
    this.bodies = els.map((el, i) => {
      let b = this.byEl.get(el);
      if (!b) {
        const m = products[i]?.motion ?? {};
        b = {
          el,
          // every product blooms out from the centre on first render
          x: this.width / 2 + (Math.random() - 0.5) * 20,
          y: this.height / 2 + (Math.random() - 0.5) * 20,
          vx: 0, vy: 0, hx: 0, hy: 0,
          r: el.offsetWidth / 2,
          seed: i * 13.37 + Math.random() * 100,
          depth: m.depth ?? Math.random(),
          spin: m.spin ?? 0,
          spinAcc: 0,
          k: m.scale ?? 1,
          s: 0.2,
          z: 0.5,
          hover: false,
          grabbed: false,
          zIndex: -1,
          blur: -1,
        };
        this.byEl.set(el, b);
        el.style.opacity = '1';
      }
      return b;
    });
    this.layoutHomes();
  }

  /** Phyllotaxis (sunflower) spread — even, organic, never a grid. */
  private layoutHomes(): void {
    const n = this.bodies.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    this.bodies.forEach((b, i) => {
      const a = i * golden;
      const r = Math.sqrt((i + 0.5) / n);
      b.hx = this.width / 2 + Math.cos(a) * r * this.width * 0.42;
      b.hy = this.height / 2 + Math.sin(a) * r * this.height * 0.38;
      b.r = b.el.offsetWidth / 2;
    });
  }

  private local(e: { clientX: number; clientY: number }) {
    return { x: e.clientX - this.rect.left, y: e.clientY - this.rect.top };
  }

  private step(t: number, dt: number): void {
    if (!dt) return;
    const rect = this.host.getBoundingClientRect();
    this.rect = rect;
    const w = this.width;
    const h = this.height;
    const turb = this.turbulence();
    const repel = this.repel();
    const blurOn = this.depthBlur();
    const p = this.pointer;
    const px = p.x - rect.left;
    const py = p.y - rect.top;
    const pointerIn = p.active && px > 0 && py > 0 && px < w && py < h;
    const R = Math.max(160, Math.min(w, h) * 0.28);
    const bodies = this.bodies;
    const ease = 1 - Math.exp(-10 * dt);

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];

      if (!b.grabbed) {
        let ax = 0;
        let ay = 0;

        if (!b.hover) {
          const f = noise3(b.x * 0.0021, b.y * 0.0021, t * 0.12 + b.seed);
          const ang = f * Math.PI * 2.5;
          ax += Math.cos(ang) * 70 * turb;
          ay += Math.sin(ang) * 70 * turb;
        }

        ax += (b.hx - b.x) * 1.3;
        ay += (b.hy - b.y) * 1.3;

        if (pointerIn && repel) {
          const dx = b.x - px;
          const dy = b.y - py;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R && !b.hover) {
            const f = (1 - d / R) ** 2 * 2600 * repel;
            ax += (dx / d) * f + p.vx * 4 * (1 - d / R);
            ay += (dy / d) * f + p.vy * 4 * (1 - d / R);
          }
        }

        for (let j = i + 1; j < bodies.length; j++) {
          const o = bodies[j];
          const dx = b.x - o.x;
          const dy = b.y - o.y;
          const min = (b.r * b.s + o.r * o.s) * 0.85;
          const d2 = dx * dx + dy * dy;
          if (d2 < min * min) {
            const d = Math.sqrt(d2) || 1;
            const push = (min - d) * 9;
            const nx = dx / d;
            const ny = dy / d;
            ax += nx * push;
            ay += ny * push;
            if (!o.grabbed) {
              o.vx -= nx * push * dt;
              o.vy -= ny * push * dt;
            }
          }
        }

        // soft walls
        const m = b.r * 0.6;
        if (b.x < m) ax += (m - b.x) * 12;
        if (b.x > w - m) ax -= (b.x - (w - m)) * 12;
        if (b.y < m) ay += (m - b.y) * 12;
        if (b.y > h - m) ay -= (b.y - (h - m)) * 12;

        const damp = Math.exp(-(b.hover ? 9 : 2.2) * dt);
        b.vx = (b.vx + ax * dt) * damp;
        b.vy = (b.vy + ay * dt) * damp;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // depth breathes slowly; drives scale, stacking, blur
      b.z = clamp(b.depth + noise3(b.seed, t * 0.07, 3.3) * 0.45, 0, 1);
      const target = mix(0.62, 1.12, b.z) * b.k * (b.hover || b.grabbed ? 1.28 : 1);
      b.s += (target - b.s) * ease;
      b.spinAcc += b.spin * dt;
      const rot = noise3(b.seed * 3, t * 0.15, 7.7) * 16 + b.spinAcc + clamp(b.vx * 0.012, -25, 25);

      b.el.style.transform =
        `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) translate(-50%, -50%) ` +
        `rotate(${rot.toFixed(2)}deg) scale(${b.s.toFixed(3)})`;

      const zi = b.grabbed ? 3000 : b.hover ? 2000 : Math.round(b.z * 100);
      if (zi !== b.zIndex) {
        b.zIndex = zi;
        b.el.style.zIndex = String(zi);
      }

      if (blurOn) {
        const blur = b.hover || b.grabbed ? 0 : Math.round(Math.max(0, 0.38 - b.z) * 16) / 2;
        if (blur !== b.blur) {
          b.blur = blur;
          b.el.style.filter = blur ? `blur(${blur}px)` : '';
        }
      }
    }
  }
}
