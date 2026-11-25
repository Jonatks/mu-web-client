import { defineMonster } from '@/controllers/monsters';

export default defineMonster({
  Numb: 583,
  Name: 'Jin',
  // Season 19 (MonsterList 583): Data/NPC/Akeron/jinn.bmd, ops/s19/monster_models.tsv (high).
  npcModel: { file: 'Akeron/jinn', scale: 0.5 },
  maxHealth: 10,
});
