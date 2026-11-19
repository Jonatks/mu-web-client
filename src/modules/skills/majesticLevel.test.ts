import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../social/social', () => ({ Social: { systemMessage: vi.fn() } }));

import { MajesticStatusPacket } from '@versions/shared/packets/ServerToClientPackets';
import { Social } from '../social/social';
import { applyMajesticStatus, majesticActive, majesticExpPercent, majesticLevel, majesticPoints } from './majesticLevel';
import { masterLevelBaseExperience } from './masterExpCurve';

function status(level: number, points: number, exp: bigint, base: bigint, next: bigint, up: boolean) {
  const p = MajesticStatusPacket.createPacket(33);
  p.buffer.setUint16(4, level, true);
  p.buffer.setUint16(6, points, true);
  p.buffer.setBigUint64(8, exp, false);
  p.buffer.setBigUint64(16, next, false);
  p.buffer.setBigUint64(24, base, false);
  p.buffer.setUint8(32, up ? 1 : 0);
  return p;
}

describe('majestic level', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads the status, keeping experience past 2^53 exact', () => {
    const top = 9_720_327_591_978_030n;
    applyMajesticStatus(status(899, 12, top - 1n, 9_542_580_411_706_230n, top, false));
    expect(majesticActive()).toBe(true);
    expect([majesticLevel(), majesticPoints()]).toEqual([899, 12]);
    expect(majesticExpPercent()).toBeGreaterThan(0.999);
    expect(Social.systemMessage).not.toHaveBeenCalled();
  });

  it('says a level up in the chat', () => {
    applyMajesticStatus(status(1, 1, 19_024_359_459n, 19_024_359_459n, 38_348_718_918n, true));
    expect(majesticExpPercent()).toBe(0);
    expect(Social.systemMessage).toHaveBeenCalledTimes(1);
  });
});

describe('master bar past 200', () => {
  it('follows the original formula to 200 and Season 19 after', () => {
    expect(masterLevelBaseExperience(1)).toBe(35_507_050);
    expect(masterLevelBaseExperience(200)).toBe(20_217_500_000);
    expect(masterLevelBaseExperience(201)).toBe(20_405_372_912);
    expect(masterLevelBaseExperience(400)).toBe(302_719_224_880);
  });
});
