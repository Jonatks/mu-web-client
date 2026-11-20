import { describe, expect, it } from 'vitest';
import { skillIconCell } from './skillCasting';

describe('skill icon cells', () => {
  it('puts a Season 19 fourth-class skill on the S19 sheet, 25 cells a row', () => {
    expect(skillIconCell(724)).toEqual({ file: 'newui_skill00.OZJ', x: 9 * 20, y: 17 * 28 });
    expect(skillIconCell(724, true)?.file).toBe('newui_non_skill00.OZJ');
  });

  it('leaves the Season 6 cells and the master tree as they were', () => {
    expect(skillIconCell(1)).toEqual({ file: 'newui_skill.OZJ', x: 0, y: 0 });
    expect(skillIconCell(390)).toBeNull();
  });
});
