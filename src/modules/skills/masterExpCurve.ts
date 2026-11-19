// Where each master level's experience starts, as the bar counts it (no game state: tested on its own).
import { MASTER_EXPERIENCE_S19, MASTER_TABLE_FROM } from './masterExpS19';

/**
 * `RenderExperience` / `CNewUIMasterLevel::RenderText`: a master level is
 * counted on top of the 400 regular levels (400 is the cap), and the
 * experience curve breaks at level 255 - the two terms of the base formula.
 */
const REGULAR_LEVEL_CAP = 400;
const CURVE_BREAK_LEVEL = 255;
/** The constant the original subtracts before halving (`iBaseExperience`). */
const BASE_EXPERIENCE_OFFSET = 3892250000;

/**
 * `iBaseExperience`: the total experience at which the current master level
 * began, from the original's two-term cubic (`RenderExperience`).
 */
export function masterLevelBaseExperience(level: number): number {
  // Past the original's 200 the server counts Season 19's table (ops/fase2/master400.sql).
  if (level >= MASTER_TABLE_FROM) return MASTER_EXPERIENCE_S19[Math.min(level, 400) - MASTER_TABLE_FROM] ?? 0;
  const total = level + REGULAR_LEVEL_CAP;
  const over = total - CURVE_BREAK_LEVEL;
  const a = (9 + total) * total * total * 10 + (9 + over) * over * over * 1000;
  return Math.trunc((a - BASE_EXPERIENCE_OFFSET) / 2);
}

