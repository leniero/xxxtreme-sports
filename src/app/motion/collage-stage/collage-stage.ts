import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChildren,
} from '@angular/core';
import { gsap } from 'gsap';
import { AlphaVideo } from '../alpha-video/alpha-video';
import { FrameLoop } from '../frame-loop.service';
import { Pointer } from '../pointer.service';

/**
 * One piece of the collage. Positions are % of the stage (centre point),
 * width in vw so the composition scales like a poster.
 */
export interface CollageLayer {
  /** image (png / webp / svg / gif / apng) — or .webm when kind === 'video' */
  src: string;
  kind?: 'image' | 'video';
  /** HEVC-with-alpha version for Safari (video only) */
  hevc?: string;
  poster?: string;
  x: number;
  y: number;
  w: number;
  /** parallax: 0 = pinned, 1 = foreground, negative = moves against the cursor */
  depth?: number;
  rotate?: number;
  /** deg / second */
  spin?: number;
  /** idle bob amplitude in px */
  float?: number;
  blend?: string;
  opacity?: number;
  z?: number;
}

/**
 * Layered, parallaxing collage of transparent images and videos.
 * Decorative only (aria-hidden, pointer-events none) — products live in
 * the ProductCloud, which can sit above, below or between collage stages.
 */
@Component({
  selector: 'app-collage-stage',
  imports: [AlphaVideo],
  template: `
    @for (l of layers(); track $index) {
      <div
        #layer
        class="layer"
        [style.left.%]="l.x"
        [style.top.%]="l.y"
        [style.width.vw]="l.w"
        [style.z-index]="l.z ?? $index"
        [style.mix-blend-mode]="l.blend ?? null"
        [style.opacity]="l.opacity ?? 1"
      >
        <div class="inner">
          @if (l.kind === 'video') {
            <app-alpha-video [webm]="l.src" [hevc]="l.hevc" [poster]="l.poster" />
          } @else {
            <img [src]="l.src" alt="" draggable="false" decoding="async" />
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .layer { position: absolute; will-change: transform; transform: translate(-50%, -50%); }
    .inner { width: 100%; }
    img { display: block; width: 100%; height: auto; }
  `,
  host: { 'aria-hidden': 'true' },
})
export class CollageStage {
  readonly layers = input.required<CollageLayer[]>();
  /** Animate the pieces in on load. */
  readonly intro = input(true);

  private readonly els = viewChildren<ElementRef<HTMLElement>>('layer');
  private readonly loop = inject(FrameLoop);
  private readonly pointer = inject(Pointer);
  private sx = 0;
  private sy = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const reduced = this.loop.reducedMotion();
      if (this.intro() && !reduced) {
        const inners = this.els().map((e) => e.nativeElement.firstElementChild);
        const tween = gsap.from(inners, {
          scale: 0.15,
          opacity: 0,
          rotation: () => gsap.utils.random(-120, 120),
          duration: 1.4,
          ease: 'expo.out',
          stagger: { each: 0.07, from: 'random' },
        });
        destroyRef.onDestroy(() => tween.kill());
      }
      if (reduced) return;
      const stop = this.loop.add((t, dt) => this.step(t, dt));
      destroyRef.onDestroy(stop);
    });
  }

  private step(t: number, dt: number): void {
    const e = 1 - Math.exp(-3 * dt);
    this.sx += (this.pointer.nx - this.sx) * e;
    this.sy += (this.pointer.ny - this.sy) * e;
    const scroll = window.scrollY;
    const layers = this.layers();
    const els = this.els();

    for (let i = 0; i < els.length; i++) {
      const l = layers[i];
      if (!l) continue;
      const d = l.depth ?? 0.3;
      const bob = Math.sin(t * 0.7 + i * 1.7) * (l.float ?? 8);
      const x = this.sx * d * 60;
      const y = this.sy * d * 40 - scroll * d * 0.35 + bob;
      const r = (l.rotate ?? 0) + (l.spin ?? 0) * t + Math.sin(t * 0.4 + i) * 2;
      els[i].nativeElement.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`;
    }
  }
}
