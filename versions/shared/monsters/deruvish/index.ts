import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 581,
  Name: 'Deruvish',
  // Season 19 (MonsterList 581): Data/NPC/Akeron/deruvish.bmd, ops/s19/monster_models.tsv (high).
  npcModel: { file: 'Akeron/deruvish' },
  maxHealth: 10,
});
