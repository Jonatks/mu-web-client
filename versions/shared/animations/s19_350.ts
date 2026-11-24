import { defineAnimation } from '@/controllers/anim';

export default defineAnimation({
  action: 350,
  name: 'PLAYER_S19_350',
  // A Season 19 clip our server's player rig carries (golpe corto, 0.3 s); its S19 name is in the S19 executable. Picked for
  // a fourth-class skill by eye (ops/plan/bitacora.md). Without it the rig plays the fallback.
  speed: 0.3,
  attack: true,
  skill: true,
  fallback: 'PLAYER_SKILL_GIANTSWING',
});
