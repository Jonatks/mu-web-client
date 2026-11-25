import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 614,
  Name: 'Normus',
  // Season 19 (MonsterList 614): Data/Monster/Monster246.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 245, scale: 1 },
  maxHealth: 13200,
});
