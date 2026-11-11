/**
 * The touch HUD's virtual stick. It only holds a direction (forward and strafe, each -1, 0 or 1, in the
 * eight directions the keyboard walk uses); `ecs/systems/playerControllerSystem.ts` reads it like the WASD
 * keys, so the walk, the wall sliding and the camera-relative aim are the same code. Drawn in
 * `versions/shared/ui/hud/mobile_controls/joystick.tsx`.
 */

export interface StickDirection {
  forward: number;
  strafe: number;
}

/** Plain object: the player controller reads it every frame, nothing needs to observe it. */
export const TouchStick: StickDirection = { forward: 0, strafe: 0 };

/** Fraction of the radius the thumb must leave before the hero walks. */
export const STICK_DEAD_ZONE = 0.3;

const OCTANT = Math.PI / 4;

/** How far past the middle of two directions the thumb must go before the stick switches (radians, about 12 degrees). */
const HYSTERESIS = 0.2;

/**
 * The thumb's offset from the stick's centre (screen axes, dy grows downwards) as a walk direction. `prev` is the
 * direction held now: a thumb resting on the line between two directions keeps it instead of flickering, because each
 * change re-aims the walk and asks the server for a new one.
 */
export function stickDirection(
  dx: number,
  dy: number,
  radius: number,
  deadZone = STICK_DEAD_ZONE,
  prev?: StickDirection
): StickDirection {
  if (radius <= 0 || Math.hypot(dx, dy) / radius < deadZone) return { forward: 0, strafe: 0 };

  const angle = Math.atan2(-dy, dx);

  if (prev && (prev.forward !== 0 || prev.strafe !== 0)) {
    const from = Math.atan2(prev.forward, prev.strafe);
    const diff = Math.abs(Math.atan2(Math.sin(angle - from), Math.cos(angle - from)));
    if (diff <= OCTANT / 2 + HYSTERESIS) return { forward: prev.forward, strafe: prev.strafe };
  }

  const octant = Math.round(angle / OCTANT);
  // `|| 0` turns the -0 that rounding a tiny negative leaves into a plain 0.
  return {
    forward: Math.round(Math.sin(octant * OCTANT)) || 0,
    strafe: Math.round(Math.cos(octant * OCTANT)) || 0,
  };
}

export function setStick(d: StickDirection): void {
  TouchStick.forward = d.forward;
  TouchStick.strafe = d.strafe;
}

export function clearStick(): void {
  TouchStick.forward = 0;
  TouchStick.strafe = 0;
}

export function stickHeld(): boolean {
  return TouchStick.forward !== 0 || TouchStick.strafe !== 0;
}
