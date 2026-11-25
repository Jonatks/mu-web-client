import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 610,
  Name: 'Debenter Elemental Knight',
  // Season 19 (MonsterList 610): Data/Monster/Monster242.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 241, scale: 1 },
  maxHealth: 70000,
});
