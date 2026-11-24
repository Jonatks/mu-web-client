import { defineAnimation } from '@/controllers/anim';

export default defineAnimation({
  action: 348,
  name: 'PLAYER_S19_348',
  // A Season 19 clip our server's player rig carries (embestida hacia adelante); its S19 name is in the S19 executable. Picked for
  // a fourth-class skill by eye (ops/plan/bitacora.md). Without it the rig plays the fallback.
  speed: 0.3,
  attack: true,
  skill: true,
  fallback: 'PLAYER_ATTACK_TWO_HAND_SWORD_TWO',
});
