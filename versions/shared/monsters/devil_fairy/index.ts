import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 586,
  Name: 'Devil Fairy',
  // Season 19 (MonsterList 586): Data/Monster/Monster218.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 217, scale: 1 },
  maxHealth: 29000,
});
