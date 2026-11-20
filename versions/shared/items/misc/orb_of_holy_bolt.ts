import { defineItem } from '@/controllers/items';

// Season 19 fourth-class skill 2025 Holy Bolt (ops/fase2/gen_skills4.py; the model is a Season 6 stand-in).
export default defineItem({
  Group: 12,
  Index: 169,
  ItemSlot: -1,
  Skill: 0,
  X: 1,
  Y: 1,
  Serial: 1,
  Opt: 1,
  Drop: 0,
  ItemName: "Orb of Holy Bolt",
  Lvl: 100,
  ReqLvl: 110,
  Energy: 1200,
  Zen: 0,
  'DW/SM': 0,
  'DK/BK': 0,
  'Elf/ME': 3,
  MG: 0,
  DL: 0,
  SUM: 0,
  RF: 0,
  szModelFolder: 'Item/',
  szModelName: 'Gem01.glb',
});
