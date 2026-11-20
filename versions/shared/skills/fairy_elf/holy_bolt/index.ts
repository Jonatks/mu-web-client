import { defineSkill } from '@/controllers/skills/define';
import { TEX } from '@/controllers/fx/recipes';
import { type ParticleRecipe } from '@/controllers/fx/core';
import { Step, arrow, particles, ring, sprite } from '@/controllers/skills/visuals';
import { effectLight } from '@/controllers/lighting/recipes';

/** Holy motes: white-gold specks rising off the target. */
const HOLY_MOTES: ParticleRecipe = {
  texture: TEX.flare,
  colour: [1, 1, 0.85],
  colourEnd: [1, 0.8, 0.3],
  size: 0.25,
  sizeJitter: 0.4,
  life: 0.8,
  box: [0.3, 0.3, 0.3],
  power: 0.6,
  gravity: -1.2,
  capacity: 128,
};

/**
 * 2025 Holy Bolt (Season 19 fourth class, our server's skill, Ice Arrow's mechanics): the bow's arrow ending in a
 * white-gold cross of light and motes rising off the target. Our own look; see ../../readme.md.
 */
const holyHit: Step = (p, c) => {
  sprite({ texture: TEX.flare, colour: [1, 1, 0.85], size: 2.6, seconds: 0.4, growFrom: 0.5, grow: 1.3, fadeTail: 0.7 })(p, c);
  ring({ texture: TEX.shockwave, colour: [1, 0.95, 0.7], scale: 1, grow: 2.2, growFrom: 0.4, seconds: 0.45, fadeTail: 0.6 })(p, c);
  particles({ recipe: HOLY_MOTES, count: 20, height: 0 })(p, c);
};

export default defineSkill({
  id: 2025,
  name: 'Holy Bolt',
  checksArrows: true,
  visual: { travel: { ...arrow(), bowArrow: true, release: true }, impact: holyHit },
  light: { impact: effectLight([1, 0.95, 0.75], 1.8, 0.5, { release: 0.35 }) },
});
