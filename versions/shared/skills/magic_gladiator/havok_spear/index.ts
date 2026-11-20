import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 2013 Havok Spear (Season 19 fourth class, our server's skill, Spiral Slash's mechanics): Spiral Slash's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 2013,
  name: 'Havok Spear',
  sound: 'Sound/sKnightSkill2',
  visual: { impact: s19Burst({ colour: [0.45, 0.7, 1], end: [0.1, 0.2, 0.8] }) },
  clip: { ground: A.PLAYER_ATTACK_ONE_FLASH }, // Spiral Slash's
});
