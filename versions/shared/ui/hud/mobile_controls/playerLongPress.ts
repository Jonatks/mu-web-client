import { Ecs } from '@/ecs/current';
import { Commands } from '@/modules/chat/commands';

/** Held this long (ms) on a player, without moving, a press is the right click that opens the quick menu. */
const HOLD_MS = 550;
/** Pixels the finger may wander before the press is a drag, not a hold. */
const SLOP = 10;

/**
 * Touch has no right click, and the original opens its quick menu (party, trade, whisper, follow...) with one on a player. A long
 * press on a player in the 3D view does the same: the canvas's own pointer stream, so a press that started on a HUD button never
 * counts. Returns the remover.
 */
export function installPlayerLongPress(): () => void {
  const canvas = Ecs.world?.scene.getEngine().getRenderingCanvas();
  if (!canvas) return () => undefined;

  let timer = 0;
  let start: { x: number; y: number } | null = null;

  const cancel = () => {
    window.clearTimeout(timer);
    start = null;
  };

  const down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    cancel();
    start = { x: e.clientX, y: e.clientY };
    timer = window.setTimeout(() => {
      const target = Ecs.world?.currentPointerTarget;
      if (start && Commands.openQuickOn(target, start.x, start.y)) start = null;
    }, HOLD_MS);
  };

  const move = (e: PointerEvent) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP) cancel();
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', cancel);
  canvas.addEventListener('pointercancel', cancel);
  return () => {
    cancel();
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', cancel);
    canvas.removeEventListener('pointercancel', cancel);
  };
}
