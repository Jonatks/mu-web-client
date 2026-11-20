import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { A } from '@/controllers/combat/recipes';

/**
 * 732 Fire Blood (Season 19 fourth class, our server's skill, Fire Slash's mechanics): Fire Slash's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 732,
  name: 'Fire Blood',
  visual: { area: s19Burst({ colour: [1, 0.55, 0.15], end: [0.7, 0.05, 0], tiles: 2, sound: 'Sound/eExplosion' }) },
  clip: { ground: A.PLAYER_ATTACK_SKILL_WHEEL }, // Fire Slash's
});
