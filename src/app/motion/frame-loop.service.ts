import { Injectable, signal } from '@angular/core';

export type FrameCallback = (time: number, dt: number) => void;

/**
 * ONE requestAnimationFrame for the whole site. Every animated system
 * registers here instead of running its own loop, so:
 *  - everything shares the same clock (easy to sync collage + cloud)
 *  - the loop sleeps when nothing is subscribed or the tab is hidden
 *  - reduced-motion is respected in a single place
 *
 * Per-frame work writes straight to the DOM (style.transform), never to
 * signals — signals would trigger change detection 60×/sec.
 */
@Injectable({ providedIn: 'root' })
export class FrameLoop {
  private readonly callbacks = new Set<FrameCallback>();
  private raf = 0;
  private last = 0;
  /** Global time scale — slow-mo everything for debugging or a "dream" state. */
  timeScale = 1;

  readonly reducedMotion = signal(false);

  constructor() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(mq.matches);
    mq.addEventListener('change', (e) => this.reducedMotion.set(e.matches));
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
  }

  add(cb: FrameCallback): () => void {
    this.callbacks.add(cb);
    this.start();
    return () => {
      this.callbacks.delete(cb);
      if (!this.callbacks.size) this.stop();
    };
  }

  private readonly tick = (now: number) => {
    // clamp dt so a dropped frame doesn't launch everything across the screen
    const dt = Math.min((now - this.last) / 1000, 1 / 20) * this.timeScale;
    this.last = now;
    const t = now / 1000;
    for (const cb of this.callbacks) cb(t, dt);
    this.raf = requestAnimationFrame(this.tick);
  };

  private start(): void {
    if (this.raf || !this.callbacks.size || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
