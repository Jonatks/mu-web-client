import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 2012 Chaos Blade (Season 19 fourth class, our server's skill, Spiral Slash's mechanics): Spiral Slash's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 2012,
  name: 'Chaos Blade',
  sound: 'Sound/sKnightSkill2',
  visual: { impact: s19Burst({ colour: [0.8, 0.4, 1], end: [0.3, 0, 0.6] }) },
  clip: { ground: A.PLAYER_S19_346 }, // a Season 19 clip picked by eye (animations/s19_346.ts)
});
