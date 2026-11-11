import { describe, expect, it } from 'vitest';
import type { Entity } from '@/ecs/world';
import { nearestTalkNpc } from './talkNearby';

const npc = (x: number, z: number, extra: Partial<Entity> = {}) =>
  ({ npcType: 240, transform: { pos: { x, z } }, ...extra }) as unknown as Entity;
const talkable = (e: Entity) => e.npcType === 240;

describe('nearestTalkNpc', () => {
  it('picks the closest NPC in range', () => {
    const near = npc(12, 10);
    expect(nearestTalkNpc([npc(15, 10), near], 10, 10, talkable)).toBe(near);
  });

  it('ignores NPCs out of range and what is not talkable', () => {
    expect(nearestTalkNpc([npc(40, 10), npc(11, 10, { npcType: 5 })], 10, 10, talkable)).toBeNull();
  });

  it('ignores NPCs that left the scope', () => {
    expect(nearestTalkNpc([npc(11, 10, { objOutOfScope: true })], 10, 10, talkable)).toBeNull();
  });
});
