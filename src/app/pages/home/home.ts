import { Component, inject, resource, signal } from '@angular/core';
import { CatalogService } from '../../core/shopify/catalog.service';
import { CollageLayer, CollageStage } from '../../motion/collage-stage/collage-stage';
import { FrameLoop } from '../../motion/frame-loop.service';
import { ProductCloud } from '../../motion/product-cloud/product-cloud';
import { ProductGrid } from '../../ui/product-grid/product-grid';

@Component({
  selector: 'app-home',
  imports: [CollageStage, ProductCloud, ProductGrid],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly catalog = inject(CatalogService);
  protected readonly loop = inject(FrameLoop);
  protected readonly products = resource({ loader: () => this.catalog.products(24) });
  protected readonly view = signal<'cloud' | 'grid'>('cloud');
  protected readonly turbulence = signal(1);

  /**
   * Back layer of the collage — sits behind the products.
   * Swap these for the brand's transparent PNGs / alpha WebMs in /public/collage.
   * Video example:
   *   { kind: 'video', src: 'collage/smoke.webm', hevc: 'collage/smoke.mov', x: 50, y: 50, w: 40 }
   */
  protected readonly back: CollageLayer[] = [
    { src: 'collage/halftone.svg', x: 18, y: 30, w: 34, depth: -0.4, spin: 2, blend: 'multiply' },
    { src: 'collage/halftone.svg', x: 86, y: 78, w: 26, depth: -0.2, spin: -3, blend: 'multiply' },
    { src: 'collage/wire.svg', x: 50, y: 88, w: 90, depth: 0.15, rotate: -4, float: 4 },
    { src: 'collage/checker.svg', x: 82, y: 22, w: 18, depth: 0.25, rotate: 9 },
    { src: 'collage/scribble.svg', x: 30, y: 70, w: 38, depth: 0.35, rotate: -8 },
  ];

  /** Front layer — floats over the products (pointer-events: none, so they stay clickable). */
  protected readonly front: CollageLayer[] = [
    { src: 'collage/chrome-star.svg', x: 9, y: 82, w: 12, depth: 1.1, spin: 14 },
    { src: 'collage/chrome-star.svg', x: 92, y: 46, w: 6, depth: 1.4, spin: -24 },
    { src: 'collage/sticker.svg', x: 78, y: 86, w: 13, depth: 0.9, spin: 6 },
    { src: 'collage/tape.svg', x: 22, y: 12, w: 22, depth: 0.8, rotate: -12, opacity: 0.95 },
  ];

  toggleView(): void {
    this.view.update((v) => (v === 'cloud' ? 'grid' : 'cloud'));
  }
}
