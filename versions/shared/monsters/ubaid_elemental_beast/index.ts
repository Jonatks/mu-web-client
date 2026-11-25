import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 590,
  Name: 'Ubaid Elemental Beast',
  // Season 19 (MonsterList 590): Data/Monster/Monster222.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 221, scale: 1 },
  maxHealth: 37500,
});
