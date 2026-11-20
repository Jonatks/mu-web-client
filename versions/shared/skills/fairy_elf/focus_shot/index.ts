import { defineSkill } from '@/controllers/skills/define';
import { FIRE_SPARKS, TEX } from '@/controllers/fx/recipes';
import { Step, arrow, particles, ring, sprite } from '@/controllers/skills/visuals';
import { effectLight } from '@/controllers/lighting/recipes';

/**
 * 727 Focus Shot (Season 19 fourth class, our server's skill, Ice Arrow's mechanics): the bow's arrow, a gathered
 * golden flash on the elf's shot and a bright burst on the target. Our own look; see ../../readme.md.
 */
const focusHit: Step = (p, c) => {
  sprite({ texture: TEX.flare, colour: [1, 0.85, 0.4], size: 2.2, seconds: 0.3, growFrom: 0.4, grow: 1.5, fadeTail: 0.6 })(p, c);
  ring({ texture: TEX.shockwave, colour: [1, 0.8, 0.35], scale: 0.8, grow: 2, growFrom: 0.3, seconds: 0.35, fadeTail: 0.6 })(p, c);
  particles({ recipe: FIRE_SPARKS, count: 14, height: 0 })(p, c);
};

export default defineSkill({
  id: 727,
  name: 'Focus Shot',
  checksArrows: true,
  visual: {
    cast: sprite({ texture: TEX.flare, colour: [1, 0.85, 0.4], size: 1.2, seconds: 0.25, fadeTail: 0.6 }),
    travel: { ...arrow(), bowArrow: true, release: true },
    impact: focusHit,
  },
  light: { impact: effectLight([1, 0.8, 0.4], 1.6, 0.4, { release: 0.3 }) },
});
