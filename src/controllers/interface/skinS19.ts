/**
 * The Season 19 skin of the modern theme (improvement `modernWindows`): pieces of the S19 client's own interface art,
 * served from `game-assets/ui-s19/` (made by ops/faseS/ui/export_skin.py; not in this repo). A piece that is not there
 * leaves the CSS theme underneath, so a tree without the skin still draws every window.
 */
import { isOn } from '@/controllers/fidelity';

const BASE = './game-assets/ui-s19/';

/** The original's sprite file (lower case) to the S19 piece drawn instead. */
const SPRITES: Readonly<Record<string, string>> = {
  'newui_item_fairy.ozt': 'slot_pet',
  'newui_item_cap.ozt': 'slot_helm',
  'newui_item_wing.ozt': 'slot_wings',
  'newui_item_weapon(l).ozt': 'slot_weapon',
  'newui_item_weapon(r).ozt': 'slot_shield',
  'newui_item_necklace.ozt': 'slot_pendant',
  'newui_item_upper.ozt': 'slot_armor',
  'newui_item_gloves.ozt': 'slot_gloves',
  'newui_item_ring.ozt': 'slot_ring',
  'newui_item_lower.ozt': 'slot_pants',
  'newui_item_boots.ozt': 'slot_boots',
  'newui_item_box.ozt': 'cell',
};

/** The URL of one S19 piece. */
export const s19Art = (name: string): string => `${BASE}${name}.png`;

/** The S19 piece that replaces a whole original sprite while the modern theme is on, or null. */
export function s19SpriteFor(file: string): string | null {
  const name = SPRITES[file.toLowerCase()];
  return name && isOn('modernWindows') ? s19Art(name) : null;
}

let varsSet = false;

/** Puts the window pieces in CSS variables once, for the stylesheets (`mu_window`, `item_grid`). */
export function applyS19SkinVars(): void {
  if (varsSet || typeof document === 'undefined') return;
  varsSet = true;
  const root = document.documentElement.style;
  // Absolute: a url() in a variable resolves against the stylesheet that reads it (`/assets/*.css`), not the page.
  for (const name of ['window_head', 'window_body', 'window_inner', 'cell', 'divider', 'tab']) {
    root.setProperty(`--s19-${name.replace('_', '-')}`, `url("${new URL(s19Art(name), document.baseURI).href}")`);
  }
}
