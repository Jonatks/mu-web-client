import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Ecs } from '@/ecs/current';
import { isAttackableEntity } from '@/ecs/systems/attackSystem';
import { MobileButton } from './mobileButton';
import { nearestTalkNpc } from './talkNearby';
import { Icon } from './icons';

/** How far (tiles) the attack button looks for something to fight. */
const ATTACK_RANGE = 8;

/**
 * The big round button bottom right: one thumb press picks the nearest monster and the hero walks to it and swings
 * (the seam a tap on the monster writes, `world.attackTarget`); pressed again it lets go.
 */
export const AttackButton = observer(() => (
  <MobileButton
    className="mobile-attack"
    title={t('mobile.attack')}
    onTap={() => {
      const world = Ecs.world;
      const hero = world?.playerEntity;
      if (!world || !hero || hero.dying) return;
      if (world.attackTarget) {
        world.attackTarget = null;
        return;
      }
      const target = nearestTalkNpc(
        world.netObjsQuery.entities,
        hero.transform.pos.x,
        hero.transform.pos.z,
        e => !e.dying && isAttackableEntity(world, e),
        ATTACK_RANGE
      );
      if (!target) return;
      world.attackTarget = target;
      world.pickupTarget = null;
      world.talkTarget = null;
    }}
  >
    {() => <Icon name="attack" size={34} />}
  </MobileButton>
));
