import type { Entity } from '@/ecs/world';

/** How far (tiles) an NPC still offers the Talk button. */
export const TALK_OFFER_RANGE = 6;

/** The closest talkable NPC in range of the hero, or null. No allocation. */
export function nearestTalkNpc(
  entities: Iterable<Entity>,
  x: number,
  z: number,
  talkable: (e: Entity) => boolean,
  range = TALK_OFFER_RANGE
): Entity | null {
  let best: Entity | null = null;
  let bestD = range * range;
  for (const e of entities) {
    if (!e.transform || e.objOutOfScope || !talkable(e)) continue;
    const d = (e.transform.pos.x - x) ** 2 + (e.transform.pos.z - z) ** 2;
    if (d <= bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}
