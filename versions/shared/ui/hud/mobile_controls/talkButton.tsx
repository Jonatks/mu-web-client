import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Ecs } from '@/ecs/current';
import { isTalkableNpc } from '@/ecs/systems/npcTalkSystem';
import { Merchant } from '@/modules/npc_shop';
import { MobileButton } from './mobileButton';
import { nearestTalkNpc } from './talkNearby';

/** Frames between looks around: an NPC does not walk away in 8 frames. */
const POLL_FRAMES = 8;

/**
 * Mu Magdalena's "Talk" pill: with an NPC close by, one thumb tap starts the
 * talk (`world.talkTarget`, the seam a tap on the NPC writes), so the small
 * NPC never has to be hit on the screen.
 */
export const TalkButton = observer(() => {
  const [name, setName] = useState('');

  useEffect(() => {
    let frame = 0;
    let n = 0;
    let shown = '';
    const poll = () => {
      frame = requestAnimationFrame(poll);
      if (++n % POLL_FRAMES) return;
      const world = Ecs.world;
      const hero = world?.playerEntity;
      const npc =
        world && hero && !hero.dying && !Merchant.npcShop
          ? nearestTalkNpc(
              world.netObjsQuery.entities,
              hero.transform.pos.x,
              hero.transform.pos.z,
              isTalkableNpc
            )
          : null;
      const next = npc ? (npc.objectNameInWorld ?? '').trimEnd() || '?' : '';
      if (next === shown) return;
      shown = next;
      setName(next);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!name) return null;

  return (
    <MobileButton
      className="mobile-talk-pill"
      title={t('mobile.talk', { name })}
      onTap={() => {
        const world = Ecs.world;
        const hero = world?.playerEntity;
        if (!world || !hero) return;
        const npc = nearestTalkNpc(
          world.netObjsQuery.entities,
          hero.transform.pos.x,
          hero.transform.pos.z,
          isTalkableNpc
        );
        if (!npc) return;
        world.talkTarget = npc;
        world.attackTarget = null;
        world.pickupTarget = null;
      }}
    >
      {() => <span>{t('mobile.talk', { name })}</span>}
    </MobileButton>
  );
});
