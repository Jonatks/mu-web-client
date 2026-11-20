import { defineSkill } from '@/controllers/skills/define';
import { TEX } from '@/controllers/fx/recipes';
import { effects } from '@/controllers/fx';
import { delay } from '@/controllers/fx/core';
import { Step, cm, perTick, ring } from '@/controllers/skills/visuals';
import { Vector3 } from '@/controllers/render/babylon/exports';
import { playCombat } from '@/controllers/sound/combat';
import { ICE_MOTES } from '../_shared';
import { A } from '@/controllers/combat/recipes';

const COUNT = 16;
const RADIUS_TILES = 3;

/**
 * 2023 Raining Arrow (Season 19 fourth class, our server's skill, Multi-Shot's mechanics): sixteen bolts of light
 * falling over its area in 0.8 s, each ending in a small ring and motes. Our own look; see ../../readme.md.
 */
const rainingArrow: Step = (p, c) => {
  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * RADIUS_TILES;
    const land = new Vector3(p.x + Math.cos(angle) * r, p.y, p.z + Math.sin(angle) * r);
    const from = new Vector3(land.x - 0.6, land.y + cm(700), land.z - 0.3);
    delay(0.15 + i * 0.05, () => {
      effects.spawn('projectile', c.scene, from, {
        to: land,
        speed: perTick(90),
        head: { texture: TEX.flare, colour: [0.7, 0.9, 1], size: 0.7, spin: 0 },
        onArrive: q => {
          ring({ texture: TEX.shockwave, colour: [0.6, 0.85, 1], scale: 0.4, grow: 2, growFrom: 0.4, seconds: 0.3, fadeTail: 0.6 })(q, c);
          effects.spawn('particles', c.scene, q, { recipe: ICE_MOTES, count: 4 });
          if (i % 4 === 0) playCombat('Sound/eBow', q);
        },
      });
    });
  }
};

export default defineSkill({
  id: 2023,
  name: 'Raining Arrow',
  checksArrows: true,
  visual: { area: rainingArrow },
  clip: { ground: A.PLAYER_ATTACK_BOW },
});
