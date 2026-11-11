/**
 * Two-finger pinch on the game canvas as camera zoom steps (the wheel's job on a mouse). Fingers spreading
 * by `PINCH_STEP_PX` is one step closer, coming together one step farther. The joystick and the buttons
 * capture their own pointer, so only the canvas's fingers count here.
 */

export const PINCH_STEP_PX = 90;

export class PinchTracker {
  private pointers = new Map<number, { x: number; y: number }>();
  /** The finger gap the last step was counted at. */
  private anchor: number | null = null;

  get pinching(): boolean {
    return this.anchor !== null;
  }

  down(id: number, x: number, y: number): void {
    if (this.pointers.size >= 2) return;
    this.pointers.set(id, { x, y });
    if (this.pointers.size === 2) this.anchor = this.gap();
  }

  up(id: number): void {
    this.pointers.delete(id);
    this.anchor = null;
  }

  /** Camera level steps for this move: negative zooms in, positive zooms out. */
  move(id: number, x: number, y: number): number {
    const at = this.pointers.get(id);
    if (!at || this.anchor === null) return 0;
    at.x = x;
    at.y = y;

    const delta = this.gap() - this.anchor;
    const steps = Math.trunc(delta / PINCH_STEP_PX);
    if (steps === 0) return 0;

    this.anchor += steps * PINCH_STEP_PX;
    return -steps;
  }

  private gap(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}

export function installPinchZoom(canvas: HTMLElement | null, active: () => boolean, onStep: (step: number) => void): void {
  if (!canvas) return;
  const tracker = new PinchTracker();

  const touch = (e: PointerEvent) => e.pointerType === 'touch';

  canvas.addEventListener('pointerdown', e => {
    if (touch(e)) tracker.down(e.pointerId, e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', e => {
    if (!touch(e) || !active()) return;
    const step = tracker.move(e.pointerId, e.clientX, e.clientY);
    if (step !== 0) onStep(step);
  });
  for (const type of ['pointerup', 'pointercancel'] as const) {
    canvas.addEventListener(type, e => {
      if (touch(e)) tracker.up(e.pointerId);
    });
  }
}
