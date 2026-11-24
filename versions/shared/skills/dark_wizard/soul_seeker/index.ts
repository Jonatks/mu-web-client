import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { TEX } from '@/controllers/fx/recipes';
import { effects } from '@/controllers/fx';
import { delay, entityPos, type ParticleRecipe } from '@/controllers/fx/core';
import { CAST_HEIGHT } from '@/controllers/lighting/skills';
import { Step, cm, perTick, ring } from '@/controllers/skills/visuals';
import { Vector3 } from '@/controllers/render/babylon/exports';
import { playCombat } from '@/controllers/sound/combat';
import { softExplosion } from '../_shared';
import { effectLight } from '@/controllers/lighting/recipes';

/** The soul's wake: pale green wisps that drift up and fade. */
const SOUL_WAKE: ParticleRecipe = {
  texture: TEX.flare,
  colour: [0.55, 1, 0.75],
  colourEnd: [0.1, 0.45, 0.35],
  size: 0.35,
  sizeJitter: 0.3,
  life: 0.6,
  box: [0.08, 0.08, 0.08],
  power: 0.3,
  gravity: -0.8,
  capacity: 256,
};

/**
 * 726 Soul Seeker (Season 19 fourth class, our server's skill): three green souls leave the caster on curving paths
 * and burst on the target's 2-tile area. Our own look: the S19 draws it in its executable. See readme.md.
 */
const soulSeeker: Step = (p, c) => {
  const from = entityPos(c.caster, CAST_HEIGHT, new Vector3());
  for (let i = 0; i < 3; i++) {
    const side = (i - 1) * 1.2;
    const start = new Vector3(from.x + Math.cos(c.yaw + Math.PI / 2) * side, from.y + cm(40) * i, from.z + Math.sin(c.yaw + Math.PI / 2) * side);
    delay(i * 0.1, () => {
      const head = start.clone();
      effects.spawn('projectile', c.scene, start, {
        to: new Vector3(p.x, p.y + cm(80), p.z),
        speed: perTick(35),
        head: { texture: TEX.flare, colour: [0.5, 1, 0.7], size: 1.4, spin: 2 },
        trail: { recipe: SOUL_WAKE, rate: 40 },
        trace: q => head.copyFrom(q),
        onArrive: q => {
          softExplosion([0.4, 1, 0.6], 0.8)(q, c);
          ring({ texture: TEX.shockwave, colour: [0.4, 1, 0.6], scale: 1.2, grow: 2, growFrom: 0.4, seconds: 0.4, fadeTail: 0.6 })(new Vector3(q.x, p.y, q.z), c);
          playCombat('Sound/eExplosion', q);
        },
      });
    });
  }
};

export default defineSkill({
  id: 726,
  name: 'Soul Seeker',
  sound: 'Sound/sEvil',
  visual: { area: soulSeeker },
  light: { land: effectLight([0.4, 1, 0.6], 1.4, 0.5, { heightOffset: 0.8, release: 0.4 }) },
  clip: { ground: A.PLAYER_S19_324 }, // a Season 19 clip picked by eye (animations/s19_324.ts)
});
