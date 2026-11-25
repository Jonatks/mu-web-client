import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 611,
  Name: 'Sellihoden',
  // Season 19 (MonsterList 611): Data/Monster/Monster243.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 242, scale: 1 },
  maxHealth: 12210,
});
