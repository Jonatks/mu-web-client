import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { Step, cm } from '@/controllers/skills/visuals';
import { Vector3 } from '@/controllers/render/babylon/exports';
import { delay } from '@/controllers/fx/core';
import { FIRE_BALL_LIGHT, METEOR_LOOK, meteor, meteorImpactFor } from '../_shared';
import { effectLight } from '@/controllers/lighting/recipes';

/**
 * 725 Meteor Storm (Season 19 fourth class, our server's skill): a rain of Meteorites over its 6-tile area, ten over
 * 1.2 s, each a little bigger than Meteorite's. Our own look, as Meteor Strike's. See readme.md.
 */
const one: Step = meteor(meteorImpactFor(725, 1.1), METEOR_LOOK, 1.3, 500);
const COUNT = 10;
const RADIUS_TILES = 3;

const meteorStorm: Step = (p, c) => {
  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * RADIUS_TILES;
    delay(i * 0.12, () => one(new Vector3(p.x + cm(Math.cos(angle) * r * 100), p.y, p.z + cm(Math.sin(angle) * r * 100)), c));
  }
};

export default defineSkill({
  id: 725,
  name: 'Meteor Storm',
  visual: { area: meteorStorm },
  light: {
    land: FIRE_BALL_LIGHT,
    bodies: {
      impact: effectLight([1, 0.6, 0.25], 1.8, 0.6, { heightOffset: 0.8, release: 0.4 }),
      crater: effectLight([1, 0.3, 0.06], 1.1, 1.2, { attack: 0.1, release: 0.7 }),
    },
  },
  clip: { ground: A.PLAYER_S19_330 }, // a Season 19 clip picked by eye (animations/s19_330.ts)
});
