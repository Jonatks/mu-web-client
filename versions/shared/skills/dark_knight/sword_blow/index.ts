import { defineSkill } from '@/controllers/skills/define';
import { A } from '@/controllers/combat/recipes';
import { s19Burst } from '../../_shared';

/**
 * 1501 Sword Blow (Season 19 fourth class, our server's skill, Twisting Slash's mechanics): an S19 spin clip and a
 * steel-white burst over its 5-tile area. Our own look: the S19 draws it in its executable. See ../../readme.md.
 */
export default defineSkill({
  id: 1501,
  name: 'Sword Blow',
  warriorGlint: true,
  visual: { area: s19Burst({ colour: [0.85, 0.9, 1], end: [0.3, 0.4, 0.7], tiles: 3, bursts: 6, sound: 'Sound/eExplosion' }) },
  clip: { ground: A.PLAYER_S19_349 }, // a Season 19 clip picked by eye (animations/s19_349.ts)
});
