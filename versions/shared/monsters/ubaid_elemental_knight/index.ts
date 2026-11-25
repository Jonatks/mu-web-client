import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 591,
  Name: 'Ubaid Elemental Knight',
  // Season 19 (MonsterList 591): Data/Monster/Monster223.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 222, scale: 1 },
  maxHealth: 38500,
});
