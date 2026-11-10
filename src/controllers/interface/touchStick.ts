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

/** The thumb's offset from the stick's centre (screen axes, dy grows downwards) as a walk direction. */
export function stickDirection(dx: number, dy: number, radius: number, deadZone = STICK_DEAD_ZONE): StickDirection {
  if (radius <= 0 || Math.hypot(dx, dy) / radius < deadZone) return { forward: 0, strafe: 0 };

  const octant = Math.round(Math.atan2(-dy, dx) / OCTANT);
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
