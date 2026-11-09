// Utilidades de dispositivo: pantalla completa + bloqueo horizontal (requieren un gesto del usuario).
export async function enterImmersive() {
  try {
    const el = document.documentElement as any;
    if (!document.fullscreenElement && el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {}
  try {
    await (screen.orientation as any)?.lock?.('landscape');
  } catch {}
}

export function isPortrait() {
  return window.matchMedia('(orientation: portrait)').matches;
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
