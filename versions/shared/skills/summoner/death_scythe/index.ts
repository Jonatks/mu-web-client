import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { s19Burst } from '../../_shared';

/**
 * 288 Death Scythe (Season 19 fourth class, our server's skill, Pollution's mechanics): Pollution's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 288,
  name: 'Death Scythe',
  sound: 'Sound/Rargle',
  visual: { area: s19Burst({ colour: [0.8, 0.15, 0.25], end: [0.2, 0, 0.1], tiles: 3, bursts: 6 }) },
  clip: { ground: A.PLAYER_S19_324 }, // a Season 19 clip picked by eye (animations/s19_324.ts)
});
