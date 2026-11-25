import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 612,
  Name: 'Ukanva',
  // Season 19 (MonsterList 612): Data/Monster/Monster244.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 243, scale: 1 },
  maxHealth: 11000,
});
