// The grids OpenMU uses. Inventory: slots 0-11 are equipment, 12-75 the 8x8 bag. Vault: slots 0-119 (8 wide, 15 tall), 240 when extended.
export type Layout = { first: number; cols: number; rows: number };
export const INVENTORY: Layout = { first: 12, cols: 8, rows: 8 };
export const vaultLayout = (extended: boolean): Layout => ({ first: 0, cols: 8, rows: extended ? 30 : 15 });

export type Placed = { slot: number; w: number; h: number };

function usedCells(items: Placed[], l: Layout): Set<number> {
  const used = new Set<number>();
  for (const it of items) {
    const i = it.slot - l.first;
    if (i < 0 || i >= l.cols * l.rows) continue;
    const r0 = Math.floor(i / l.cols);
    const c0 = i % l.cols;
    for (let r = r0; r < r0 + it.h; r++) for (let c = c0; c < c0 + it.w; c++) used.add(r * l.cols + c);
  }
  return used;
}

function free(used: Set<number>, l: Layout, r: number, c: number, w: number, h: number): boolean {
  if (c + w > l.cols || r + h > l.rows) return false;
  for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) if (used.has((r + dr) * l.cols + c + dc)) return false;
  return true;
}

/** First slot (row by row) where a w x h item fits, or null when the grid is full. */
export function freeSlot(items: Placed[], w: number, h: number, l: Layout = INVENTORY): number | null {
  const used = usedCells(items, l);
  for (let r = 0; r < l.rows; r++) for (let c = 0; c < l.cols; c++) if (free(used, l, r, c, w, h)) return l.first + r * l.cols + c;
  return null;
}

/** True when a w x h item can sit with its top-left corner at `slot`. */
export function fits(items: Placed[], slot: number, w: number, h: number, l: Layout = INVENTORY): boolean {
  const i = slot - l.first;
  if (!Number.isInteger(i) || i < 0 || i >= l.cols * l.rows) return false;
  return free(usedCells(items, l), l, Math.floor(i / l.cols), i % l.cols, w, h);
}
