import type { Item } from '@/ecs/world';
import { ItemSerializer } from '@/controllers/item_rules/itemSerializer';

/**
 * The Season 19 shop tabs: the server half is the plugin `S19ShopPages` (openmu/plugins), on this module's id.
 * Out: `0` asks for the open merchant's other tabs; `1, page, slot` picks the item the next buy gets (page 0 is
 * tab 2). In: `0, count`, then per tab `n` and n items of 9 bytes: slot, group, number (2, little endian), level,
 * durability, skill + luck * 2, option level, excellent bits.
 */
const ITEM_BYTES = 9;

/** One 9-byte entry as the classic 12 bytes (`ItemSerializer`'s layout), so it reads like any other item. */
export function pageItem(b: Uint8Array): Item {
  const [, group, lo, hi, level, durability, flags, option, excellent] = b;
  const num = lo | (hi << 8);
  const c = new Uint8Array(ItemSerializer.NeededSpace);
  c[0] = num & 0xff;
  c[1] = ((level << 3) & 0x78) | (flags & 1 ? 0x80 : 0) | (flags & 2 ? 0x04 : 0) | (option & 3);
  c[2] = durability;
  c[3] = ((option & 4) << 4) | (excellent & 0x3f) | (num & 0x100 ? 0x80 : 0);
  c[5] = group << 4;
  c.fill(0xff, 7);
  return ItemSerializer.DeserializeItem(c);
}

/** The tabs of an answer to `0`. */
export function decodePages(payload: Uint8Array): { slot: number; item: Item }[][] {
  const pages: { slot: number; item: Item }[][] = [];
  let at = 2;
  for (let p = 0; p < (payload[1] ?? 0) && at < payload.length; p++) {
    const count = payload[at++];
    const page: { slot: number; item: Item }[] = [];
    for (let i = 0; i < count && at + ITEM_BYTES <= payload.length; i++, at += ITEM_BYTES) {
      const entry = payload.subarray(at, at + ITEM_BYTES);
      page.push({ slot: entry[0], item: pageItem(entry) });
    }
    pages.push(page);
  }
  return pages;
}

