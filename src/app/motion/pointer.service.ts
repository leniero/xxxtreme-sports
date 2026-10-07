import { Injectable } from '@angular/core';

/**
 * Global pointer state, read every frame by animated systems.
 * Plain mutable fields on purpose (see FrameLoop).
 */
@Injectable({ providedIn: 'root' })
export class Pointer {
  /** viewport px */
  x = window.innerWidth / 2;
  y = window.innerHeight / 2;
  /** normalised −1…1 from viewport centre — good for parallax */
  nx = 0;
  ny = 0;
  /** px per event, smoothed — good for "wind" / trails */
  vx = 0;
  vy = 0;
  active = false;

  constructor() {
    window.addEventListener(
      'pointermove',
      (e) => {
        this.vx = this.vx * 0.6 + (e.clientX - this.x) * 0.4;
        this.vy = this.vy * 0.6 + (e.clientY - this.y) * 0.4;
        this.x = e.clientX;
        this.y = e.clientY;
        this.nx = (e.clientX / window.innerWidth) * 2 - 1;
        this.ny = (e.clientY / window.innerHeight) * 2 - 1;
        this.active = true;
      },
      { passive: true },
    );
    document.addEventListener('pointerleave', () => (this.active = false));
  }
}
