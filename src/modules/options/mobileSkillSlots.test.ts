import { beforeEach, describe, expect, it, vi } from 'vitest';

// The skills module reads `location` when it loads.
vi.hoisted(() => {
  (globalThis as { location?: unknown }).location ??= { href: '', search: '' };
});

import { MobileSkillSlots } from './mobileSkillSlots';
import { isHotbarSkill } from '../skills/skillCasting';

const hotbar = (from = 0, count = 5) => Array.from({ length: 400 }, (_, i) => i).filter(isHotbarSkill).slice(from, from + count);

describe('MobileSkillSlots.seed', () => {
  beforeEach(() => MobileSkillSlots.assign(0, -1));

  it('fills a fresh character with its first learned skills, once', () => {
    const [a, b, c, d, e, f, g] = hotbar(0, 7);
    MobileSkillSlots.forCharacter('Fresh');
    MobileSkillSlots.seed([a, b, c, d, e, f, g]);
    expect(MobileSkillSlots.slots).toEqual([a, b, c, d, e, f]);

    MobileSkillSlots.assign(1, -1);
    MobileSkillSlots.seed([a, b, c, d, e, f, g]);
    expect(MobileSkillSlots.slots).toEqual([a, -1, c, d, e, f]);
  });

  it('leaves a character the player emptied alone', () => {
    const [a, b] = hotbar();
    MobileSkillSlots.forCharacter('Cleared');
    MobileSkillSlots.assign(0, -1);
    MobileSkillSlots.seed([a, b]);
    expect(MobileSkillSlots.slots).toEqual([-1, -1, -1, -1, -1, -1]);
  });
});
