import { ENUM_WORLD } from '@/core/types';
import type { MapLayer } from '@/controllers/maps/layer';
import { FULL_TILES } from '../recipes';
import { DEBENTER_SOUND } from './sound';

/**
 * Debenter (`WD_95DEBENTER`, `World96` / `Object96`), a Season 13 map drawn from the Season 19 client's files.
 * Data only, like Acheron: no original source to port. It has no spawn gate of its own (death returns to Acheron).
 */

const WORLDS: readonly ENUM_WORLD[] = [ENUM_WORLD.WD_95DEBENTER];

// The Season 19 gate 436, where Acheron's gate 435 lands (`World/GateTemplate.xml`: 19-20, 104-105).
const SPAWN = { x: 20, y: 105 } as const;

export const debenterLayer: MapLayer = {
  name: 'debenter',
  worlds: WORLDS,
  tiles: FULL_TILES,
  spawn: SPAWN,
  outdoor: true,
  sound: DEBENTER_SOUND,
};
