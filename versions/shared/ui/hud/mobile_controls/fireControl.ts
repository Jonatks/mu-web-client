import { Ecs } from '@/ecs/current';
import { isAttackableEntity } from '@/ecs/systems/attackSystem';
import type { Entity } from '@/ecs/world';
import { HeroSkills } from '@/modules/skills';
import { isAttackSkill } from '@/modules/skills/skillCasting';
import { skillUsability } from '@/modules/skills/usability';
import { skillDefinition } from '@versions/shared/skills/skillsDatabase';
import { castSkill } from './castSkill';
import { MobileMenu } from './menuState';
import { nearestTalkNpc } from './talkNearby';
import { stickHeld } from '@/controllers/interface/touchStick';

/** How far (tiles) the cast button looks for something to fight. */
export const FIRE_RANGE = 8;
/** Ms between looks at the fight: who is the target, can the skill be afforded. */
const TICK_MS = 120;

export function nearestMonster(): Entity | null {
  const world = Ecs.world;
  const hero = world?.playerEntity;
  if (!world || !hero || hero.dying) return null;
  return nearestTalkNpc(
    world.netObjsQuery.entities,
    hero.transform.pos.x,
    hero.transform.pos.z,
    e => !e.dying && isAttackableEntity(world, e),
    FIRE_RANGE
  );
}

/** Class, level, energy, weapon, mana and AG pass; the delay and the safe zone are momentary and do not count. */
function affordable(skill: number): boolean {
  return skillUsability(skill).blocks.every(b => b === 'cooldown' || b === 'safezone');
}

/**
 * Take a monster as the target (the seam a tap on it writes) and, when the skill in hand is an attack skill the hero can pay for, arm its
 * repeat in the same breath: otherwise the plain swing would get a frame or two to walk up and punch before the first cast.
 */
function engage(target: Entity): void {
  const world = Ecs.world;
  if (!world) return;
  world.attackTarget = target;
  world.pickupTarget = null;
  world.talkTarget = null;
  const skill = HeroSkills.currentSkill;
  if (skillDefinition(skill) && isAttackSkill(skill) && affordable(skill)) {
    world.touchCastHeld = true;
    const pos = target.transform?.pos;
    if (pos) world.castRequest = { target, point: { x: pos.x, y: pos.z }, forced: false };
  }
}

/** Let go: no target, no repeat. */
export function stopFire(): void {
  const world = Ecs.world;
  MobileMenu.firing = false;
  if (!world) return;
  world.touchCastHeld = false;
  world.castRequest = null;
  world.attackTarget = null;
}

/**
 * The big cast button, and a tap on a skill box: pick the nearest monster and keep hitting it with the CURRENT skill - Energy Ball, a
 * book spell, anything that hurts - the way the right button held down does on a mouse; with no attack skill selected it is the
 * plain swing. Pressed again it lets go. Returns false when there was nothing to fight.
 */
export function startFire(): boolean {
  const world = Ecs.world;
  if (!world?.playerEntity || world.playerEntity.dying) return false;
  const target = world.attackTarget && !world.attackTarget.dying && isAttackableEntity(world, world.attackTarget) ? world.attackTarget : nearestMonster();
  if (!target) return false;
  engage(target);
  MobileMenu.firing = true;
  return true;
}

export function toggleFire(): void {
  if (MobileMenu.firing) stopFire();
  else startFire();
}

/**
 * A skill box: selects the skill. A skill that hurts starts the fight at once; a buff, a heal, a summon or a teleport is cast on
 * the spot (on the hero or ahead, as `castSkill` decides) and the fight, if any, goes on.
 */
export function useSkill(number: number): void {
  HeroSkills.selectSkill(number);
  if (isAttackSkill(number)) {
    if (!MobileMenu.firing) startFire();
    return;
  }
  castSkill(number);
}

/**
 * Keeps the fight going (installed while the HUD is up): the target stays the nearest living monster in AUTO, the repeat is held
 * while the current skill is an attack skill the hero can pay for, and drops back to the plain swing when it is not.
 */
export function installFireLoop(): () => void {
  const id = window.setInterval(() => {
    const world = Ecs.world;
    const hero = world?.playerEntity;
    if (!world) return;
    if (!MobileMenu.firing && !MobileMenu.auto) {
      if (world.touchCastHeld) world.touchCastHeld = false;
      return;
    }
    if (!hero || hero.dying) {
      stopFire();
      return;
    }
    // The thumb is on the pad: the player is walking, so nothing is picked up or fired until it lifts.
    if (stickHeld()) {
      MobileMenu.firing = false;
      world.touchCastHeld = false;
      return;
    }

    let target = world.attackTarget;
    if (!target || target.dying || !isAttackableEntity(world, target) || target.worldIndex !== world.mapIndex) {
      world.touchCastHeld = false;
      world.castRequest = null;
      target = MobileMenu.auto ? nearestMonster() : null;
      if (!target) {
        // Nothing left to hit: the repeat ends (AUTO keeps looking).
        MobileMenu.firing = false;
        world.attackTarget = null;
        return;
      }
      engage(target);
      MobileMenu.firing = true;
    }

    const skill = HeroSkills.currentSkill;
    if (!skillDefinition(skill) || !isAttackSkill(skill) || !affordable(skill)) {
      world.touchCastHeld = false;
      return;
    }
    world.touchCastHeld = true;
    if (!world.castRequest) {
      const pos = target.transform!.pos;
      world.castRequest = { target, point: { x: pos.x, y: pos.z }, forced: false };
    }
  }, TICK_MS);
  return () => {
    window.clearInterval(id);
    const world = Ecs.world;
    if (world) world.touchCastHeld = false;
  };
}
