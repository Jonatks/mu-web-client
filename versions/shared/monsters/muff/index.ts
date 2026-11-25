import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 615,
  Name: 'Muff',
  // Season 19 (MonsterList 615): Data/Monster/Monster247.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 246, scale: 1 },
  maxHealth: 10800,
});
