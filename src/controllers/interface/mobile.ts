/**
 * The one place the client decides it is played by touch (`?mobile=1|0` overrides).
 * Imported by `app/main.tsx` before the version loads, so it has no imports. See readme.md.
 */

const ROOT_CLASS = 'mu-mobile';

function readOverride(): boolean | null {
  if (typeof window === 'undefined') return null;
  // `location` can be missing where tests stub `window` (camera/view.test.ts).
  const param = new URLSearchParams(window.location?.search ?? '').get('mobile');
  if (param === '1') return true;
  if (param === '0') return false;
  return null;
}

function detect(): boolean {
  const override = readOverride();
  if (override !== null) return override;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse && navigator.maxTouchPoints > 0;
}

const mobile = detect();

/**
 * The touch HUD (Mu Magdalena's layout: level badge, Talk button, stats sheet, menus) over the classic interface.
 * Off by default, the owner's choice (2026-11-25): a phone gets the classic interface and only the thumb stick.
 * `?touchhud=1|0` or the `_mu_touch_hud` key turn it back on.
 */
const TOUCH_HUD_KEY = '_mu_touch_hud';
function readTouchHud(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location?.search ?? '').get('touchhud');
  if (param === '1' || param === '0') return param === '1';
  try {
    return window.localStorage?.getItem(TOUCH_HUD_KEY) === '1';
  } catch {
    return false;
  }
}
const touchHud = mobile && readTouchHud();

// The class the stylesheets key on, set before React's first paint so no
// desktop rule flashes on a phone.
if (mobile && typeof document !== 'undefined') {
  document.documentElement.classList.add(ROOT_CLASS);
  if (touchHud) document.documentElement.classList.add('mu-touch-hud');
}

export function isMobileDevice(): boolean {
  return mobile;
}

export function useIsMobile(): boolean {
  return mobile;
}

/** Whether the touch HUD replaces the classic interface's bar, buttons, login and windows (see `touchHud`). */
export function isTouchHud(): boolean {
  return touchHud;
}
