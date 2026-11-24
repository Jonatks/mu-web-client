import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 282 Spirit Hook (Season 19 fourth class, our server's skill, Chain Drive's mechanics): Chain Drive's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 282,
  name: 'Spirit Hook',
  sound: 'Sound/Ragefighter/Rage_Giantswing',
  visual: { impact: s19Burst({ colour: [0.5, 0.9, 1], end: [0.1, 0.4, 0.8], tiles: 2 }) },
  clip: { ground: A.PLAYER_S19_350 }, // a Season 19 clip picked by eye (animations/s19_350.ts)
});
