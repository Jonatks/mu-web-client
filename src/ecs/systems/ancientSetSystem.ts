import { ancientSetComplete } from '../../controllers/item_rules';
import { keepLook, type BuffLook } from '../../controllers/skills/visuals';
import { Hero } from '../../modules/hero';
import type { Entity, ISystemFactory } from '../world';

/** The look's key among an entity's buff looks: a buff id is never negative. */
const ANCIENT_SET_KEY = -2;
const LOOK: BuffLook = () => ({ ancientBlur: true });

/**
 * `c->ExtendState` (ZzzCharacter.cpp:11156-11166): a body wearing every piece of an ancient set draws
 * the set's blur. The hero's own comes from its worn items (`CheckItemSetOptions`), other players'
 * from the flag their appearance carries.
 */
export const AncientSetSystem: ISystemFactory = world => {
  const query = world.with('charAppearance', 'transform');
  const lit = new WeakSet<Entity>();

  return {
    update: () => {
      for (const e of query) {
        const wants = e.localPlayer ? ancientSetComplete(Hero.items) : e.charAppearance.ancientSet === true;
        if (wants) {
          keepLook(world.scene, e, ANCIENT_SET_KEY, LOOK);
          lit.add(e);
        } else if (lit.delete(e)) keepLook(world.scene, e, ANCIENT_SET_KEY, null);
      }
    },
  };
};
