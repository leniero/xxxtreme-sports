import { Component, DestroyRef, ElementRef, afterNextRender, inject, input, viewChild } from '@angular/core';

/**
 * Transparent video that works everywhere:
 *  - Chrome / Firefox / Edge: WebM VP9 with alpha
 *  - Safari (macOS + iOS): HEVC with alpha (.mov / .mp4, codec hvc1)
 * Export both from After Effects / ffmpeg (see README "Transparent video").
 * Pauses itself off-screen — with dozens of alpha videos in a collage, this
 * is the difference between smooth and melting the GPU.
 */
@Component({
  selector: 'app-alpha-video',
  template: `<video #v muted loop playsinline preload="metadata" [attr.poster]="poster()" aria-hidden="true"></video>`,
  styles: `
    :host { display: block; }
    video { display: block; width: 100%; height: auto; background: transparent; }
  `,
})
export class AlphaVideo {
  readonly webm = input.required<string>();
  readonly hevc = input<string>();
  readonly poster = input<string>();
  readonly rate = input(1);

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('v');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const v = this.video().nativeElement;
      const ua = navigator.userAgent;
      const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
      const hevc = this.hevc();
      v.src = isSafari && hevc ? hevc : this.webm();
      v.playbackRate = this.rate();

      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()),
        { rootMargin: '200px' },
      );
      io.observe(v);
      destroyRef.onDestroy(() => io.disconnect());
    });
  }
}
