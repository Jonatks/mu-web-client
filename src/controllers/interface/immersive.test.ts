import { describe, expect, it } from 'vitest';
import { enterImmersive, shouldPromptFullscreen, type ImmersiveEnv } from './immersive';

const calls: string[] = [];

const env = (over: Partial<ImmersiveEnv> = {}): ImmersiveEnv => ({
  isFullscreen: () => false,
  requestFullscreen: async () => {
    calls.push('fullscreen');
  },
  lockLandscape: async () => {
    calls.push('lock');
  },
  ...over,
});

describe('enterImmersive', () => {
  it('goes fullscreen first and then locks landscape', async () => {
    calls.length = 0;
    expect(await enterImmersive(env())).toBe('locked');
    expect(calls).toEqual(['fullscreen', 'lock']);
  });

  it('reports unsupported where there is no fullscreen API (iPhone)', async () => {
    expect(await enterImmersive(env({ requestFullscreen: undefined }))).toBe('unsupported');
  });

  it('stays in fullscreen when the orientation lock is refused', async () => {
    const result = await enterImmersive(
      env({
        lockLandscape: async () => {
          throw new Error('NotSupportedError');
        },
      })
    );
    expect(result).toBe('fullscreen');
  });

  it('stays in fullscreen when there is no lock to call', async () => {
    expect(await enterImmersive(env({ lockLandscape: undefined }))).toBe('fullscreen');
  });

  it('reports denied when the browser rejects the fullscreen request, and does not lock', async () => {
    calls.length = 0;
    const result = await enterImmersive(
      env({
        requestFullscreen: async () => {
          throw new Error('NotAllowedError');
        },
      })
    );
    expect(result).toBe('denied');
    expect(calls).toEqual([]);
  });

  it('does not ask for fullscreen again when it is already on, but still locks', async () => {
    calls.length = 0;
    expect(await enterImmersive(env({ isFullscreen: () => true }))).toBe('locked');
    expect(calls).toEqual(['lock']);
  });
});

describe('shouldPromptFullscreen', () => {
  const base = { mobile: true, wanted: true, supported: true, fullscreen: false, portrait: false };

  it('prompts a touch player who had fullscreen and lost it, in landscape', () => {
    expect(shouldPromptFullscreen(base)).toBe(true);
  });

  it('never prompts on a mouse device, before the first tap, or where it is unsupported', () => {
    expect(shouldPromptFullscreen({ ...base, mobile: false })).toBe(false);
    expect(shouldPromptFullscreen({ ...base, wanted: false })).toBe(false);
    expect(shouldPromptFullscreen({ ...base, supported: false })).toBe(false);
  });

  it('does not prompt while fullscreen, or in portrait (the rotate screen asks instead)', () => {
    expect(shouldPromptFullscreen({ ...base, fullscreen: true })).toBe(false);
    expect(shouldPromptFullscreen({ ...base, portrait: true })).toBe(false);
  });
});
