import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 609,
  Name: 'Debenter Elemental Beast',
  // Season 19 (MonsterList 609): Data/Monster/Monster241.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 240, scale: 1 },
  maxHealth: 63000,
});
