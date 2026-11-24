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

/** Original sheets redrawn frame for frame (same layout, twice the size): file to [piece, sheet width, height]. */
const SHEETS: Readonly<Record<string, readonly [string, number, number]>> = {
  'partcharge1/newui_menu_bt05.ozj': ['btn_shop', 30, 164],
  'partcharge1/newui_menu_bt01.ozj': ['btn_character', 30, 164],
  'partcharge1/newui_menu_bt02.ozj': ['btn_inventory', 30, 164],
  'partcharge1/newui_menu_bt03.ozj': ['btn_friends', 30, 164],
  'partcharge1/newui_menu_bt04.ozj': ['btn_menu', 30, 164],
};

/** The URL of one S19 piece. */
export const s19Art = (name: string): string => `${BASE}${name}.png`;

/** The S19 piece that replaces a whole original sprite while the modern theme is on, or null. */
export function s19SpriteFor(file: string): string | null {
  const name = SPRITES[file.toLowerCase()];
  return name && isOn('modernWindows') ? s19Art(name) : null;
}

/** The S19 sheet laid out like the original's (`url`, its size in the original's pixels), or null. */
export function s19SheetFor(file: string): { url: string; size: string } | null {
  const sheet = SHEETS[file.toLowerCase()];
  return sheet && isOn('modernWindows') ? { url: s19Art(sheet[0]), size: `${sheet[1]}px ${sheet[2]}px` } : null;
}

/** The pieces the stylesheets read as `--s19-<name>` (underscores become dashes). */
const VAR_PIECES = [
  'window_head', 'window_body', 'window_inner', 'cell', 'divider', 'tab',
  'hud_orb_frame_l', 'hud_orb_frame_r', 'hud_orb_glass', 'hud_slot', 'hud_bar_l', 'hud_bar_r', 'hud_desk',
];

let varsSet = false;

/** Puts the window pieces in CSS variables once, for the stylesheets (`mu_window`, `item_grid`). */
export function applyS19SkinVars(): void {
  if (varsSet || typeof document === 'undefined') return;
  varsSet = true;
  const root = document.documentElement.style;
  // Absolute: a url() in a variable resolves against the stylesheet that reads it (`/assets/*.css`), not the page.
  for (const name of VAR_PIECES) {
    root.setProperty(`--s19-${name.replaceAll('_', '-')}`, `url("${new URL(s19Art(name), document.baseURI).href}")`);
  }
  // The HUD's S19 layer keys on this class; the window frame does not need it (its classes are the modern theme's).
  if (isOn('modernWindows')) document.documentElement.classList.add('s19-skin');
}
