import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../social/social', () => ({ Social: { systemMessage: vi.fn() } }));

import { MajesticStatusPacket } from '@versions/shared/packets/ServerToClientPackets';
import { Social } from '../social/social';
import { applyMajesticStatus, majesticActive, majesticExpPercent, majesticLevel, majesticPoints, majesticStatPoints } from './majesticLevel';
import { majesticStatCap, majesticStatNodes, majesticStatValue } from './majesticStatTree';
import { masterLevelBaseExperience } from './masterExpCurve';

function status(level: number, points: number, exp: bigint, base: bigint, next: bigint, up: boolean) {
  const p = MajesticStatusPacket.createPacket(41);
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

  it('reads the points of the stat tree', () => {
    const p = status(70, 3, 0n, 0n, 1n, false);
    p.buffer.setUint8(33, 12);
    p.buffer.setUint8(40, 5);
    applyMajesticStatus(p);
    expect([majesticStatPoints(0), majesticStatPoints(7)]).toEqual([12, 5]);
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

describe('majestic stat tree', () => {
  const hp = majesticStatNodes(1)[0];

  it('opens each tier at its Majestic level, as SkillTreeMajesticStat.xml', () => {
    expect([19, 20, 45, 65].map(l => majesticStatCap(hp, l))).toEqual([0, 10, 20, 40]);
  });

  it('follows FormulaData.xml: 70 HP a point to 30, then 42', () => {
    expect([0, 1, 30, 31, 40].map(p => majesticStatValue(hp, p))).toEqual([0, 70, 2100, 2142, 2520]);
  });

  it('has eight nodes for each Season 6 class', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(c => majesticStatNodes(c).length)).toEqual([8, 8, 8, 8, 8, 8, 8]);
  });
});
