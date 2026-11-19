import type { AbstractEngine } from './babylon/exports';

/**
 * Pixel density: how many device pixels per CSS pixel the 3D view is drawn at. Step 0 is what the engine
 * starts with (1 on a computer, 1.5 on a phone, `app/boot.tsx`); 1 asks for 2; 2 for the screen's own ratio.
 * A phone's screen has 2 to 3, so step 2 is the sharpest picture and the most pixels to draw.
 */
export const PIXEL_DENSITY_MAX = 2;
/** What a phone starts at: sharper than 1, cheaper than its own ratio (`app/boot.tsx`). */
export const PHONE_START_DENSITY = 1.5;
const STEP_CAPS = [0, 2, 3];

/** Device pixels per CSS pixel for a step, never above the screen's own ratio. */
export function pixelDensityFor(step: number, screenRatio: number, startCap: number): number {
  const i = Math.min(PIXEL_DENSITY_MAX, Math.max(0, Math.round(step) || 0));
  return Math.min(screenRatio, i === 0 ? startCap : Math.max(startCap, STEP_CAPS[i]));
}

let applied = 0;

/** Moves Babylon's hardware scaling level by the ratio between the density it holds and the wanted one. */
export function applyPixelDensity(engine: AbstractEngine, density: number, startDensity: number): void {
  const from = applied || startDensity;
  if (density === from) return;
  engine.setHardwareScalingLevel(engine.getHardwareScalingLevel() * (from / density));
  applied = density;
}

/** Test seam. */
export function resetPixelDensity(): void {
  applied = 0;
}
