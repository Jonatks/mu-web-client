import { defineAnimation } from '@/controllers/anim';

export default defineAnimation({
  action: 343,
  name: 'PLAYER_S19_343',
  // A Season 19 clip our server's player rig carries (disparo con el brazo extendido); its S19 name is in the S19 executable. Picked for
  // a fourth-class skill by eye (ops/plan/bitacora.md). Without it the rig plays the fallback.
  speed: 0.3,
  attack: true,
  skill: true,
  fallback: 'PLAYER_ATTACK_BOW',
});
