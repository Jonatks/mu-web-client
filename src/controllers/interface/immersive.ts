import { makeAutoObservable } from 'mobx';
import { isMobileDevice } from './mobile';

/**
 * Fullscreen and landscape for a touch player: the first tap asks for fullscreen and locks the
 * orientation, a phone held upright sees the rotate screen, and leaving fullscreen later asks
 * again on the next tap. Rules and limits (iPhone has no fullscreen API): readme.md.
 */

export interface ImmersiveEnv {
  isFullscreen(): boolean;
  /** Missing where the browser has no fullscreen API for pages. */
  requestFullscreen?: () => Promise<void>;
  /** Missing where there is no orientation lock. It only works while fullscreen. */
  lockLandscape?: () => Promise<void>;
}

export type ImmersiveResult = 'locked' | 'fullscreen' | 'unsupported' | 'denied';

/** Fullscreen first, then landscape. A refused lock still leaves the fullscreen it got. */
export async function enterImmersive(env: ImmersiveEnv): Promise<ImmersiveResult> {
  const already = env.isFullscreen();
  const request = env.requestFullscreen;
  if (!already && !request) return 'unsupported';
  if (!already && request) {
    try {
      await request();
    } catch {
      return 'denied';
    }
  }
  if (!env.lockLandscape) return 'fullscreen';
  try {
    await env.lockLandscape();
    return 'locked';
  } catch {
    return 'fullscreen';
  }
}

export interface PromptInput {
  mobile: boolean;
  /** The player has tapped at least once, so fullscreen is expected. */
  wanted: boolean;
  supported: boolean;
  fullscreen: boolean;
  portrait: boolean;
}

/** The "tap to play full screen" hint: lost fullscreen on a touch device, in landscape. */
export function shouldPromptFullscreen(i: PromptInput): boolean {
  return i.mobile && i.wanted && i.supported && !i.fullscreen && !i.portrait;
}

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
};
type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

function browserEnv(): ImmersiveEnv {
  const doc = document as FsDoc;
  const el = document.documentElement as FsEl;
  const standard = el.requestFullscreen?.bind(el, { navigationUI: 'hide' } as FullscreenOptions);
  const webkit = el.webkitRequestFullscreen?.bind(el);
  const orientation = (screen as Screen & { orientation?: LockableOrientation }).orientation;

  return {
    isFullscreen: () => !!(doc.fullscreenElement ?? doc.webkitFullscreenElement),
    requestFullscreen: standard ?? (webkit ? async () => void (await webkit()) : undefined),
    lockLandscape: orientation?.lock ? () => orientation.lock?.('landscape') ?? Promise.resolve() : undefined,
  };
}

class ImmersiveState {
  portrait = false;
  fullscreen = false;
  /** Set by the first tap. */
  wanted = false;
  /** The browser can make a page fullscreen at all. */
  supported = false;

  constructor() {
    makeAutoObservable(this);
  }

  get showRotate(): boolean {
    return isMobileDevice() && this.portrait;
  }

  get promptFullscreen(): boolean {
    return shouldPromptFullscreen({
      mobile: isMobileDevice(),
      wanted: this.wanted,
      supported: this.supported,
      fullscreen: this.fullscreen,
      portrait: this.portrait,
    });
  }
}

export const Immersive = new ImmersiveState();

let installed = false;

/** Called once at boot; does nothing on a mouse device. */
export function installImmersive(): void {
  if (installed || !isMobileDevice() || typeof window === 'undefined') return;
  installed = true;

  const doc = document as FsDoc;
  const portrait = window.matchMedia('(orientation: portrait)');
  const refresh = () => {
    Immersive.portrait = portrait.matches;
    Immersive.fullscreen = !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
  };

  Immersive.supported = !!(
    document.documentElement.requestFullscreen ??
    (document.documentElement as FsEl).webkitRequestFullscreen
  );
  refresh();
  portrait.addEventListener('change', refresh);
  document.addEventListener('fullscreenchange', refresh);
  document.addEventListener('webkitfullscreenchange', refresh);

  // Browsers only allow fullscreen from a tap, so every tap that finds the page outside it asks
  // again; once it is on, this costs one boolean read.
  window.addEventListener(
    'pointerup',
    () => {
      Immersive.wanted = true;
      if (Immersive.fullscreen || !Immersive.supported) return;
      void enterImmersive(browserEnv()).then(refresh);
    },
    { capture: true }
  );
}
