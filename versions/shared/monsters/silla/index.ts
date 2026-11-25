import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 613,
  Name: 'Silla',
  // Season 19 (MonsterList 613): Data/Monster/Monster245.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 244, scale: 1 },
  maxHealth: 10450,
});
