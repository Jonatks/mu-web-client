import { defineAnimation } from '@/controllers/anim';

export default defineAnimation({
  action: 298,
  name: 'PLAYER_S19_298',
  // A Season 19 clip our server's player rig carries, not used yet; its S19 name is in the S19 executable
  // (ops/plan/bitacora.md). `/anim 298` shows it.
  speed: 0.3,
  oneShot: true,
});
