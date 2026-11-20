import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { SUMMON_CLIPS } from '../_shared';

/**
 * 729 Fire Beast (Season 19 fourth class, our server's skill, Explosion's mechanics): Explosion's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 729,
  name: 'Fire Beast',
  sound: 'Sound/SE_Ch_summoner_skill05_explosion01',
  visual: { area: s19Burst({ colour: [1, 0.5, 0.1], end: [0.6, 0.05, 0], tiles: 2, bursts: 3 }) },
  clip: SUMMON_CLIPS, // Explosion's
});
