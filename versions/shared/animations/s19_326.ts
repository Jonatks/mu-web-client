import { defineAnimation } from '@/controllers/anim';

export default defineAnimation({
  action: 326,
  name: 'PLAYER_S19_326',
  // A Season 19 clip our server's player rig carries (los dos brazos arriba, conjuro corto); its S19 name is in the S19 executable. Picked for
  // a fourth-class skill by eye (ops/plan/bitacora.md). Without it the rig plays the fallback.
  speed: 0.3,
  attack: true,
  skill: true,
  fallback: 'PLAYER_SKILL_HELL_BEGIN',
});
