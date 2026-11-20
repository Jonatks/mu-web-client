/**
 * The Majestic stat tree of Season 19 (Skill/SkillTreeMajesticStat.xml, FormulaData.xml type 3), made by
 * ops/fase2/gen_majestic_stat.py, the same as the plugin's MajesticStatTree.cs. Eight nodes per class: section * 4 + id.
 */

export interface MajesticStatNode {
  skill: number;
  /** Majestic level that opens a tier, then its top: three pairs. */
  tiers: number[];
  end1: number;
  f1: number;
  f2: number;
  stats: string[];
}

const FORMULAS: Record<number, (p: number) => number> = {
  152: (p: number) => 70*p,
  153: (p: number) => (8+(p*0))*p,
  154: (p: number) => 15*p,
  155: (p: number) => 7*p,
  157: (p: number) => 13*p,
  158: (p: number) => (8+(p*0))*p,
  159: (p: number) => 50*p,
  160: (p: number) => 7*p,
  161: (p: number) => 13*p,
  210: (p: number) => 7*p,
  211: (p: number) => 7*p,
  212: (p: number) => 7*p,
  222: (p: number) => 2100+((p-30)*42),
  223: (p: number) => 450+((p-30)*9),
  224: (p: number) => 390+((p-30)*8),
  225: (p: number) => 1500+((p-30)*30),
};

/** The S19 names (SkillList.xml); the window shows them as they are. */
export const MAJESTIC_STAT_NAMES: Record<number, string> = {
  1137: 'Increase Max HP',
  1138: '4th Stat',
  1139: 'Increase Basic DEF',
  1140: 'Increase Defense of Lv. 4 Wings /Cape',
  1141: 'Increase DMG',
  1142: 'Increase Magic',
  1143: '4th Stat',
  1144: 'Increase Skill DMG',
  1145: 'Increase ATK of Lv. 4 Wings /Cape',
  1146: 'Increase DMG / Magic',
  1157: 'Increases Wizardry/Curse',
  1193: 'Increase Wizardry of Lv. 4 Wings/Cape',
  1194: 'Increase ATK/Wizardry of Lv. 4 Wings/Cape',
  1195: 'Increase Wizardry/Curse of Lv. 4 Wings/Cape',
  1241: '4th Stat Increase',
  1242: '4th Stat Increase',
};

/** By OpenMU class number / 4 (the client's class code >> 2 the same way). */
const CLASSES: MajesticStatNode[][] = [
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1138, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1142, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 157, f2: 224, stats: ['WizardryBaseDmg'] },
    { skill: 1143, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalEnergy'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1193, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 210, f2: 210, stats: ['WizardryBaseDmg'] },
  ],
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1138, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1141, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 157, f2: 224, stats: ['PhysicalBaseDmg'] },
    { skill: 1143, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalStrength'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1145, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 155, f2: 155, stats: ['PhysicalBaseDmg'] },
  ],
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1138, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1141, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 157, f2: 224, stats: ['PhysicalBaseDmg'] },
    { skill: 1143, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalAgility'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1145, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 155, f2: 155, stats: ['PhysicalBaseDmg'] },
  ],
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1138, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1146, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 161, f2: 224, stats: ['BaseDamageBonus'] },
    { skill: 1143, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalStrength'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1194, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 211, f2: 211, stats: ['BaseDamageBonus'] },
  ],
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1241, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1141, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 157, f2: 224, stats: ['PhysicalBaseDmg'] },
    { skill: 1242, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalLeadership'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1145, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 155, f2: 155, stats: ['PhysicalBaseDmg'] },
  ],
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1138, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1157, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 157, f2: 224, stats: ['WizardryBaseDmg', 'CurseBaseDmg'] },
    { skill: 1143, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalEnergy'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1195, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 212, f2: 212, stats: ['WizardryBaseDmg', 'CurseBaseDmg'] },
  ],
  [
    { skill: 1137, tiers: [20, 10, 45, 20, 65, 40], end1: 30, f1: 152, f2: 222, stats: ['MaximumHealth'] },
    { skill: 1138, tiers: [40, 10, 80, 20, 120, 40], end1: 30, f1: 153, f2: 153, stats: ['TotalVitality'] },
    { skill: 1139, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 154, f2: 223, stats: ['DefenseBase'] },
    { skill: 1140, tiers: [70, 10, 110, 20, 150, 40], end1: 30, f1: 160, f2: 160, stats: ['DefenseBase'] },
    { skill: 1141, tiers: [10, 10, 35, 20, 60, 40], end1: 30, f1: 157, f2: 224, stats: ['PhysicalBaseDmg'] },
    { skill: 1143, tiers: [30, 10, 70, 20, 110, 40], end1: 30, f1: 158, f2: 158, stats: ['TotalStrength'] },
    { skill: 1144, tiers: [50, 10, 90, 20, 130, 40], end1: 30, f1: 159, f2: 225, stats: ['SkillDamageBonus'] },
    { skill: 1145, tiers: [60, 10, 100, 20, 140, 40], end1: 30, f1: 155, f2: 155, stats: ['PhysicalBaseDmg'] },
  ],
];

export const majesticStatNodes = (classIndex: number): MajesticStatNode[] => CLASSES[classIndex] ?? [];

/** The most points the node takes at a Majestic level. */
export function majesticStatCap(node: MajesticStatNode, level: number): number {
  let cap = 0;
  for (let i = 0; i < node.tiers.length; i += 2) if (level >= node.tiers[i]) cap = node.tiers[i + 1];
  return cap;
}

/** What the node adds at `points` points. */
export const majesticStatValue = (node: MajesticStatNode, points: number): number =>
  points <= 0 ? 0 : FORMULAS[points <= node.end1 ? node.f1 : node.f2](points);
