// Los 11 sets ancient clasicos que faltaban (Mahes a Magni). Fuente unica: de aqui salen classic_ancient.sql y los archivos del cliente.
// Los numeros vienen de la guia de muonlinefanz (no oficial): se ajustan jugando. Orden de las opciones: una por pieza
// desde la segunda (tramos de 2, 3, 4 piezas), luego las del set completo.

export type Kind = 'str' | 'agi' | 'ene' | 'vit' | 'minDmg' | 'maxDmg' | 'wiz' | 'life' | 'def' | 'critRate' | 'critDmg' | 'excRate' | 'excDmg' | 'skill' | 'double' | 'ignore' | 'shield' | 'twoH';

/** Opcion del cliente (AT_SET_OPTION_*, tooltip SET_OPTION_TEXT), atributo del servidor, agregacion de OpenMU y escala del valor (guia -> servidor). */
export const KINDS: Record<Kind, { client: number; attr: string; aggregate: 0 | 1 | 2; scale: number; add?: number }> = {
  str: { client: 0, attr: 'Total Strength', aggregate: 0, scale: 1 },
  agi: { client: 1, attr: 'Total Agility', aggregate: 0, scale: 1 },
  ene: { client: 2, attr: 'Total Energy', aggregate: 0, scale: 1 },
  vit: { client: 3, attr: 'Total Vitality', aggregate: 0, scale: 1 },
  minDmg: { client: 5, attr: 'Minimum Physical Base Damage', aggregate: 0, scale: 1 },
  maxDmg: { client: 6, attr: 'Maximum Physical Base Damage', aggregate: 0, scale: 1 },
  wiz: { client: 7, attr: 'Wizardry Base Damage Increase', aggregate: 1, scale: 0.01, add: 1 },
  life: { client: 11, attr: 'Maximum Health', aggregate: 0, scale: 1 },
  def: { client: 10, attr: 'Base Defense', aggregate: 2, scale: 1 },
  critRate: { client: 15, attr: 'Critical Damage Chance', aggregate: 0, scale: 0.01 },
  critDmg: { client: 16, attr: 'Critical Damage Bonus', aggregate: 0, scale: 1 },
  excRate: { client: 17, attr: 'Excellent Damage Chance', aggregate: 0, scale: 0.01 },
  excDmg: { client: 18, attr: 'Excellent Damage Bonus', aggregate: 0, scale: 1 },
  skill: { client: 19, attr: 'Skill Damage Bonus', aggregate: 0, scale: 1 },
  double: { client: 20, attr: 'Double Damage Chance', aggregate: 0, scale: 0.01 },
  ignore: { client: 21, attr: 'Defense Ignore Chance', aggregate: 0, scale: 0.01 },
  shield: { client: 22, attr: 'Defense Increase Multiplier With Equipped Shield', aggregate: 0, scale: 0.01 },
  twoH: { client: 23, attr: 'Two-Handed Weapon Physical Damage Increase (Ancient Option)', aggregate: 0, scale: 0.01 },
};

export type Opt = readonly [Kind, number];
export type SetDef = {
  /** Numero del set en el cliente (50 es Bes Eclipse). */
  number: number;
  name: string;
  /** Estadistica que da cada pieza ancient (+5 / +10). */
  stat: 'str' | 'agi' | 'ene' | 'vit';
  /** [grupo, numero] de cada pieza. */
  pieces: readonly (readonly [number, number])[];
  /** Una opcion por tramo (2 piezas, 3 piezas...), luego las del set completo. */
  standard: readonly Opt[];
  full: readonly Opt[];
};

export const SETS: readonly SetDef[] = [
  { number: 51, name: 'Mahes', stat: 'str', pieces: [[9, 16], [6, 12]], standard: [['life', 100]], full: [['ignore', 6], ['shield', 17]] },
  { number: 52, name: 'Bragi', stat: 'str', pieces: [[8, 17], [9, 17], [7, 17], [11, 17], [0, 17]], standard: [['str', 10], ['str', 20], ['str', 30], ['life', 50]], full: [['minDmg', 30], ['twoH', 6], ['double', 3], ['skill', 50]] },
  { number: 53, name: 'Alvis', stat: 'ene', pieces: [[8, 18], [10, 18], [11, 18], [13, 27], [5, 9]], standard: [['double', 1], ['double', 2], ['double', 3], ['ene', 10]], full: [['ignore', 1], ['critRate', 8], ['excRate', 8], ['shield', 8]] },
  { number: 54, name: 'Serket', stat: 'agi', pieces: [[7, 36], [9, 36]], standard: [['agi', 40]], full: [['agi', 90], ['agi', 40]] },
  { number: 55, name: 'Apis', stat: 'str', pieces: [[11, 37], [13, 13]], standard: [['maxDmg', 60]], full: [['critDmg', 40], ['excDmg', 40]] },
  { number: 56, name: 'Tyr', stat: 'str', pieces: [[9, 20], [10, 20], [11, 20], [13, 12], [0, 31]], standard: [['str', 20], ['agi', 20], ['vit', 20], ['ene', 20]], full: [['double', 1], ['wiz', 1], ['twoH', 6], ['excRate', 12]] },
  { number: 57, name: 'Khone', stat: 'str', pieces: [[10, 27], [11, 27]], standard: [['life', 200]], full: [['critRate', 3], ['excRate', 3]] },
  { number: 58, name: 'Surt', stat: 'str', pieces: [[7, 38], [8, 38], [10, 38], [11, 38], [2, 11]], standard: [['shield', 2], ['def', 20], ['str', 30], ['life', 70]], full: [['skill', 40], ['critDmg', 80], ['critRate', 1], ['ene', 60]] },
  { number: 59, name: 'Harpy', stat: 'ene', pieces: [[8, 41], [11, 41]], standard: [['agi', 10]], full: [['ignore', 1], ['def', 40]] },
  { number: 60, name: 'Horus', stat: 'vit', pieces: [[0, 33], [13, 28]], standard: [['minDmg', 80]], full: [['skill', 60], ['double', 4]] },
  { number: 61, name: 'Magni', stat: 'vit', pieces: [[7, 61], [8, 61], [11, 61], [13, 23], [0, 34]], standard: [['maxDmg', 5], ['maxDmg', 10], ['maxDmg', 20], ['life', 100]], full: [['def', 50], ['excDmg', 10], ['excRate', 8], ['minDmg', 60]] },
];
