import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 582,
  Name: 'Adniel',
  // Season 19 (MonsterList 582): Data/NPC/adniel.bmd, ops/s19/monster_models.tsv (high).
  npcModel: { file: 'adniel' },
  maxHealth: 10,
});
