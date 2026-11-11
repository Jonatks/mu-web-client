import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Ecs } from '@/ecs/current';
import { isAttackableEntity } from '@/ecs/systems/attackSystem';
import { HeroSkills } from '@/modules/skills';
import { isHotbarSkill } from '@/modules/skills/skillCasting';
import { SkillIcon } from '../../components/skill_icon';
import { MobileButton } from './mobileButton';
import { nearestTalkNpc } from './talkNearby';
import { castSkill } from './castSkill';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

/** How far (tiles) the attack button looks for something to fight. */
const ATTACK_RANGE = 8;
/** AUTO: how often (ms) it looks for the next monster once the last one is down. */
const AUTO_INTERVAL = 700;

/** The nearest monster in reach, or null. */
function nearestMonster() {
  const world = Ecs.world;
  const hero = world?.playerEntity;
  if (!world || !hero || hero.dying) return null;
  return nearestTalkNpc(
    world.netObjsQuery.entities,
    hero.transform.pos.x,
    hero.transform.pos.z,
    e => !e.dying && isAttackableEntity(world, e),
    ATTACK_RANGE
  );
}

/** Take a monster as the target: the seam a tap on it writes. */
function engage(target: NonNullable<ReturnType<typeof nearestMonster>>): void {
  const world = Ecs.world;
  if (!world) return;
  world.attackTarget = target;
  world.pickupTarget = null;
  world.talkTarget = null;
}

/**
 * The big round button bottom right (Mu Magdalena's skill button): it shows the current skill, and one thumb press picks the
 * nearest monster and the hero walks to it and fights (the seam a tap on the monster writes, `world.attackTarget`); with a skill
 * selected the skill is cast on it. Pressed again it lets go. In AUTO mode it picks the next monster by itself, like a small Helper.
 */
export const AttackButton = observer(() => {
  const current = HeroSkills.currentSkill;
  const showSkill = current >= 0 && isHotbarSkill(current);
  const auto = MobileMenu.auto;

  useEffect(() => {
    if (!auto) return undefined;
    const id = window.setInterval(() => {
      const world = Ecs.world;
      if (!world || world.attackTarget) return;
      const next = nearestMonster();
      if (next) engage(next);
    }, AUTO_INTERVAL);
    return () => window.clearInterval(id);
  }, [auto]);

  return (
    <>
      <MobileButton
        className="mobile-book"
        title={t('skills.title')}
        onTap={() => (MobileMenu.picker = 0)}
      >
        {() => <Icon name="skills" size={22} />}
      </MobileButton>
      <MobileButton
        className={`mobile-attack${auto ? ' is-auto' : ''}`}
        title={t('mobile.attack')}
        onTap={() => {
          const world = Ecs.world;
          if (!world) return;
          if (world.attackTarget) {
            world.attackTarget = null;
            if (auto) MobileMenu.auto = false;
            return;
          }
          const target = nearestMonster();
          if (!target) return;
          engage(target);
          if (showSkill) castSkill(current);
        }}
      >
        {() =>
          showSkill ? (
            <div className="mobile-attack-skill">
              <SkillIcon number={current} disabled={false} />
            </div>
          ) : (
            <Icon name="attack" size={34} />
          )
        }
      </MobileButton>
    </>
  );
});
