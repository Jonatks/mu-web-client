import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 595,
  Name: 'Gnome',
  // Season 19 (MonsterList 595): Data/Monster/Monster227.bmd, ops/s19/monster_models.tsv (high).
  model: { type: 226, scale: 1 },
  maxHealth: 12000,
});
