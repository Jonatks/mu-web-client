import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 588,
  Name: 'Elemental Knight',
  // Season 19 (MonsterList 588): Data/Monster/Monster220.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 219, scale: 1 },
  maxHealth: 33000,
});
