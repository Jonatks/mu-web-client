import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { s19Burst } from '../../_shared';

/**
 * 733 Dark Blast (Season 19 fourth class, our server's skill, Cometfall's mechanics): Cometfall's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 733,
  name: 'Dark Blast',
  visual: { area: s19Burst({ colour: [0.6, 0.3, 0.9], end: [0.15, 0, 0.3], tiles: 2, bursts: 4, sound: 'Sound/eExplosion' }) },
  clip: { ground: A.PLAYER_S19_326 }, // a Season 19 clip picked by eye (animations/s19_326.ts)
});
