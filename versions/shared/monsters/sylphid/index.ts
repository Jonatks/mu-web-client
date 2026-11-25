import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 594,
  Name: 'Sylphid',
  // Season 19 (MonsterList 594): Data/Monster/Monster226.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 225, scale: 1 },
  maxHealth: 9500,
});
