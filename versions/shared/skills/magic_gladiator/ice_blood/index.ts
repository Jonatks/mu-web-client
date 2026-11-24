import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 731 Ice Blood (Season 19 fourth class, our server's skill, Power Slash's mechanics): Power Slash's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 731,
  name: 'Ice Blood',
  visual: { area: s19Burst({ colour: [0.55, 0.85, 1], end: [0.1, 0.3, 1], tiles: 2, sound: 'Sound/eExplosion' }) },
  clip: { ground: A.PLAYER_S19_348 }, // a Season 19 clip picked by eye (animations/s19_348.ts)
});
