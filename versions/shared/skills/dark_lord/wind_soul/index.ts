import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 737 Wind Soul (Season 19 fourth class, our server's skill, Chaotic Diseier's mechanics): Chaotic Diseier's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 737,
  name: 'Wind Soul',
  sound: 'Sound/caotic',
  visual: { area: s19Burst({ colour: [0.6, 1, 0.6], end: [0.1, 0.5, 0.2], tiles: 2, bursts: 5 }) },
  clip: { ground: A.PLAYER_ATTACK_STRIKE }, // Chaotic Diseier's
});
