import { defineAnimation } from '@/controllers/anim';

export default defineAnimation({
  action: 351,
  name: 'PLAYER_S19_351',
  // A Season 19 clip our server's player rig carries (salto y golpe, 1.9 s); its S19 name is in the S19 executable. Picked for
  // a fourth-class skill by eye (ops/plan/bitacora.md). Without it the rig plays the fallback.
  speed: 0.3,
  attack: true,
  skill: true,
  fallback: 'PLAYER_SKILL_DRAGONKICK',
});
