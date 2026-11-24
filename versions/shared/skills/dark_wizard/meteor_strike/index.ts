import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { Step } from '@/controllers/skills/visuals';
import { Vector3 } from '@/controllers/render/babylon/exports';
import { delay } from '@/controllers/fx/core';
import { cm } from '@/controllers/skills/visuals';
import { FIRE_BALL_LIGHT, METEOR_LOOK, meteor, meteorImpactFor } from '../_shared';
import { effectLight } from '@/controllers/lighting/recipes';

/**
 * 724 Meteor Strike (Season 19 fourth class, our server's skill): the S19 draws it in its executable, so it is
 * Meteorite grown: one meteor 2.2 times the size from twice as high and a landing 1.8 times as wide, then two
 * smaller ones within its 2-tile area. See readme.md.
 */
const big: Step = meteor(meteorImpactFor(724, 1.8), METEOR_LOOK, 2.2, 800);
const small: Step = meteor(meteorImpactFor(724, 0.9), METEOR_LOOK, 1.1, 600);

export const meteorStrike: Step = (p, c) => {
  big(p, c);
  for (const [dx, dz, at] of [[1.2, 0.6, 0.18], [-0.8, -1.1, 0.32]] as const) {
    delay(at, () => small(new Vector3(p.x + cm(dx * 100), p.y, p.z + cm(dz * 100)), c));
  }
};

export const METEOR_STRIKE_LIGHT = {
  land: FIRE_BALL_LIGHT,
  bodies: {
    impact: effectLight([1, 0.6, 0.25], 2.6, 0.8, { heightOffset: 0.8, release: 0.5 }),
    crater: effectLight([1, 0.3, 0.06], 1.6, 1.6, { attack: 0.1, release: 0.9, flicker: { min: 0.75, max: 1, steps: 4 } }),
  },
};

export default defineSkill({
  id: 724,
  name: 'Meteor Strike',
  // The Magic Gladiator's Meteor Strike (734) is the same skill on its scroll.
  lookAliases: [734],
  visual: { area: meteorStrike },
  light: METEOR_STRIKE_LIGHT,
  clip: { ground: A.PLAYER_S19_326 }, // a Season 19 clip picked by eye (animations/s19_326.ts)
});
