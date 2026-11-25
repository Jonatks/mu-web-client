import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 587,
  Name: 'Elemental Beast',
  // Season 19 (MonsterList 587): Data/Monster/Monster219.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 218, scale: 1 },
  maxHealth: 32000,
});
