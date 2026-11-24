import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { s19Burst } from '../../_shared';

/**
 * 739 Dark Phoenix Shot (Season 19 fourth class, our server's skill, Phoenix Shot's mechanics): Phoenix Shot's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 739,
  name: 'Dark Phoenix Shot',
  visual: { area: s19Burst({ colour: [1, 0.3, 0.2], end: [0.3, 0, 0.1], tiles: 2, bursts: 4, sound: 'Sound/eExplosion' }) },
  clip: { ground: A.PLAYER_S19_351 }, // a Season 19 clip picked by eye (animations/s19_351.ts)
});
