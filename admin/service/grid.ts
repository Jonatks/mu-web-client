// The inventory grid OpenMU uses: slots 0-11 are equipment, 12-75 the 8x8 bag.
export const BAG_FIRST = 12;
export const BAG_COLS = 8;
export const BAG_ROWS = 8;

export type Placed = { slot: number; w: number; h: number };

/** First slot (row by row) where a w x h item fits in the bag, or null when it is full. */
export function freeSlot(items: Placed[], w: number, h: number): number | null {
  const used = new Set<number>();
  for (const it of items) {
    const i = it.slot - BAG_FIRST;
    if (i < 0 || i >= BAG_COLS * BAG_ROWS) continue;
    const r0 = Math.floor(i / BAG_COLS);
    const c0 = i % BAG_COLS;
    for (let r = r0; r < r0 + it.h; r++) for (let c = c0; c < c0 + it.w; c++) used.add(r * BAG_COLS + c);
  }
  for (let r = 0; r + h <= BAG_ROWS; r++) {
    for (let c = 0; c + w <= BAG_COLS; c++) {
      let ok = true;
      for (let dr = 0; dr < h && ok; dr++) for (let dc = 0; dc < w && ok; dc++) ok = !used.has((r + dr) * BAG_COLS + c + dc);
      if (ok) return BAG_FIRST + r * BAG_COLS + c;
    }
  }
  return null;
}
