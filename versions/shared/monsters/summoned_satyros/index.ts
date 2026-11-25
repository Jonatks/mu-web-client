import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 597,
  Name: 'Summoned Satyros',
  // Season 19 (MonsterList 597): the model of Season 6 monster 353, ops/s19/monster_models.tsv (medium).
  model: { type: 109, scale: 1.3 },
  maxHealth: 30000,
});
