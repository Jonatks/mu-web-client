import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 596,
  Name: 'Hellraiser',
  // Season 19 (MonsterList 596): Data/Monster/Monster228.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 227, scale: 1 },
  maxHealth: 9000,
});
