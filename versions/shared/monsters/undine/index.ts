import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 592,
  Name: 'Undine',
  // Season 19 (MonsterList 592): Data/Monster/Monster224.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 223, scale: 1 },
  maxHealth: 11100,
});
