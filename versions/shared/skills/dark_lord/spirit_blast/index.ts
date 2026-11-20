import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 2095 Spirit Blast (Season 19 fourth class, our server's skill, Fire Scream's mechanics): Fire Scream's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 2095,
  name: 'Spirit Blast',
  sound: 'Sound/Darklord_firescream',
  visual: { area: s19Burst({ colour: [1, 0.85, 0.4], end: [0.8, 0.3, 0], tiles: 3, bursts: 6 }) },
  clip: { ground: A.PLAYER_ATTACK_STRIKE }, // Fire Scream's
});
