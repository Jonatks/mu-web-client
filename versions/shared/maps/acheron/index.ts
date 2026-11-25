import { ENUM_WORLD } from '@/core/types';
import type { MapLayer } from '@/controllers/maps/layer';
import { FULL_TILES } from '../recipes';
import { ACHERON_SOUND } from './sound';

/**
 * Acheron (`WD_91ACHERON`, `World92` / `Object92`), a Season 12 map drawn from the Season 19 client's files.
 * There is no original source for it, so the entry is data only: its objects draw as loaded (the `_R` textures
 * already go additive), with no per-type behaviour. See readme.md, "Season 19 maps".
 */

const WORLDS: readonly ENUM_WORLD[] = [ENUM_WORLD.WD_91ACHERON];

// Like Karutan, slot 12 is `AlphaTile01` (the folder ships no Rock06): its 2 tiles in EncTerrain92.map draw no ground.
// Rock05 names the slot so the fetch finds a file.
const TILES = FULL_TILES.map((t, i) => (i === 12 ? 'TileRock05' : t));
const CUTOUT = 12;

// The Season 19 spawn gate 417 (`World/GateTemplate.xml`: 51-60, 190-197), centred.
const SPAWN = { x: 55, y: 193 } as const;

export const acheronLayer: MapLayer = {
  name: 'acheron',
  worlds: WORLDS,
  tiles: TILES,
  cutoutTile: CUTOUT,
  spawn: SPAWN,
  outdoor: true,
  sound: ACHERON_SOUND,
};
