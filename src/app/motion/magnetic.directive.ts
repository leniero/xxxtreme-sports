import { Directive, ElementRef, inject, input } from '@angular/core';

/** Element leans toward the cursor while hovered. `appMagnetic="0.4"` = strength. */
@Directive({
  selector: '[appMagnetic]',
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset()',
    '[style.transition]': '"transform .35s cubic-bezier(.2,.9,.25,1.4)"',
  },
})
export class MagneticDirective {
  readonly appMagnetic = input(0.35, { transform: (v: string | number) => Number(v) || 0.35 });
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  move(e: PointerEvent): void {
    const r = this.el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const s = this.appMagnetic();
    this.el.style.transform = `translate(${dx * s}px, ${dy * s}px)`;
  }

  reset(): void {
    this.el.style.transform = '';
  }
}
