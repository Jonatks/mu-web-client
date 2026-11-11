import { isMobileDevice } from './mobile';

/**
 * Taps made while a finger holds the thumb stick. A browser only makes the mouse events a window's
 * buttons listen for (mousedown, mouseup, click) for a lone finger, so with the stick held a tap on the
 * inventory's close button did nothing. Those taps get the click made here. The HUD buttons read pointer
 * events and are unaffected; a lone tap is left to the browser, so nothing fires twice.
 */

const TAP_SLOP_PX = 12;

export class MultiTouchTap {
  private fingers = new Map<number, { x: number; y: number; onStick: boolean }>();

  down(id: number, x: number, y: number, onStick: boolean): void {
    this.fingers.set(id, { x, y, onStick });
  }

  /** True when this lift was a tap that needs the click made for it. */
  up(id: number, x: number, y: number): boolean {
    const f = this.fingers.get(id);
    this.fingers.delete(id);
    if (!f || f.onStick) return false;
    if (Math.hypot(x - f.x, y - f.y) > TAP_SLOP_PX) return false;
    return [...this.fingers.values()].some(other => other.onStick);
  }

  cancel(id: number): void {
    this.fingers.delete(id);
  }
}

let installed = false;

/** Called once at boot; does nothing on a mouse device. */
export function installMultiTouchTap(): void {
  if (installed || !isMobileDevice() || typeof window === 'undefined') return;
  installed = true;

  const taps = new MultiTouchTap();
  const touch = (e: PointerEvent) => e.pointerType === 'touch';

  window.addEventListener(
    'pointerdown',
    e => {
      if (!touch(e)) return;
      const onStick = !!(e.target as Element | null)?.closest?.('.mobile-stick');
      taps.down(e.pointerId, e.clientX, e.clientY, onStick);
    },
    { capture: true }
  );

  window.addEventListener(
    'pointerup',
    e => {
      if (!touch(e) || !taps.up(e.pointerId, e.clientX, e.clientY)) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;
      for (const type of ['mousedown', 'mouseup', 'click']) {
        target.dispatchEvent(
          new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: e.clientX, clientY: e.clientY, button: 0 })
        );
      }
    },
    { capture: true }
  );

  window.addEventListener('pointercancel', e => taps.cancel(e.pointerId), { capture: true });
}
