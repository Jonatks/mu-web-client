import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 589,
  Name: 'Ubaid Devilfairy',
  // Season 19 (MonsterList 589): Data/Monster/Monster221.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 220, scale: 1 },
  maxHealth: 35000,
});
