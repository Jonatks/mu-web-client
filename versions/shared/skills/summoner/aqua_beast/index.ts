import { defineSkill } from '@/controllers/skills/define';
import { s19Burst } from '../../_shared';
import { SUMMON_CLIPS } from '../_shared';

/**
 * 730 Aqua Beast (Season 19 fourth class, our server's skill, Requiem's mechanics): Requiem's cast and an S19 burst
 * in its own colour (`s19Burst`). Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 730,
  name: 'Aqua Beast',
  sound: 'Sound/SE_Ch_summoner_skill06_requiem01',
  visual: { area: s19Burst({ colour: [0.35, 0.75, 1], end: [0, 0.25, 0.7], tiles: 2, bursts: 3 }) },
  clip: SUMMON_CLIPS, // Requiem's
});
