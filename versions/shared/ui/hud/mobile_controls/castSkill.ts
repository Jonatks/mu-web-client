import { Ecs } from '@/ecs/current';
import { Social } from '@/modules/social/social';
import { HeroSkills } from '@/modules/skills';
import { TELEPORT, TELEPORT_ALLY } from '@/modules/skills/skillCasting';
import { aimAlongFacing, teleportSquareOpen } from '@/modules/warp/teleportRules';
import { skillDefinition } from '@versions/shared/skills/skillsDatabase';
import { isAttackableEntity } from '@/ecs/systems/attackSystem';

/**
 * Fire the linked skill at whatever is targeted.
 *
 * This writes the one seam the right mouse button writes and stops there:
 * `SkillCastSystem` owns range, the walk into it, mana and AG, the re-use
 * delay, the clip and the packet. No combat rule is duplicated here.
 *
 * The point falls back to the hero's own tile with nothing targeted, which is
 * what a self-cast (Swell Life, the summons) or an area skill dropped where
 * you stand wants. A tap on the ground clears the request again
 * (`playerControllerSystem`) - the touch stand-in for letting the button go.
 */
export function castSkill(number: number): void {
  const world = Ecs.world;
  const hero = world?.playerEntity;
  if (!world || !hero || hero.dying) return;

  HeroSkills.selectSkill(number);

  // Teleport has no cursor to aim at here, and neither the monster's tile nor
  // the hero's own is a jump: it takes the furthest open square straight ahead.
  if (number === TELEPORT) {
    const yaw = hero.transform.rot.y;
    const pos = hero.transform.pos;
    const to = aimAlongFacing(
      { x: Math.floor(pos.x), y: Math.floor(pos.z) },
      { x: Math.sin(yaw), z: -Math.cos(yaw) },
      skillDefinition(TELEPORT)?.distance ?? 6,
      (x, y) => teleportSquareOpen(world.getTerrainFlag(x, y))
    );
    if (to) world.castRequest = { target: null, point: { x: to.x, y: to.y }, forced: false };
    return;
  }

  // Teleport Ally has no player to pick here: it pulls the nearest party member in sight.
  if (number === TELEPORT_ALLY) {
    const heroPos = hero.transform.pos;
    let mate: (typeof world.netObjsQuery.entities)[number] | null = null;
    let best = Infinity;
    for (const e of world.netObjsQuery.entities) {
      const name = e.objectNameInWorld?.trimEnd();
      if (e.localPlayer || !e.playerAnimation || !e.transform || !name) continue;
      if (!Social.partyMembers.some(m => m.name.trimEnd() === name)) continue;
      const d = (e.transform.pos.x - heroPos.x) ** 2 + (e.transform.pos.z - heroPos.z) ** 2;
      if (d < best) {
        best = d;
        mate = e;
      }
    }
    if (mate) world.castRequest = { target: mate, point: null, forced: false };
    return;
  }

  const picked = world.attackTarget;
  const target = picked && isAttackableEntity(world, picked) ? picked : null;
  const pos = target?.transform?.pos;

  world.castRequest = {
    target,
    point: pos
      ? { x: pos.x, y: pos.z }
      : { x: hero.transform.pos.x, y: hero.transform.pos.z },
    forced: false,
  };
}
