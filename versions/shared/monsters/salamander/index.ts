import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 593,
  Name: 'Salamander',
  // Season 19 (MonsterList 593): Data/Monster/Monster225.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 224, scale: 1 },
  maxHealth: 10000,
});
