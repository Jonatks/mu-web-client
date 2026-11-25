import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 608,
  Name: 'Debenter Devil Fairy',
  // Season 19 (MonsterList 608): Data/Monster/Monster240.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 239, scale: 1 },
  maxHealth: 57000,
});
