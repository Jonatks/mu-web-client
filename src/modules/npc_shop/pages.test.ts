import { describe, expect, it } from 'vitest';
import { decodePages, pageItem } from './pagesWire';

describe('shop pages', () => {
  it('reads a 9-byte entry as the item it names', () => {
    const item = pageItem(new Uint8Array([7, 14, 3, 0, 2, 255, 3, 4, 0b101]));
    expect([item.group, item.num, item.lvl, item.durability]).toEqual([14, 3, 2, 255]);
  });

  it('reads item numbers past 255', () => {
    expect(pageItem(new Uint8Array([0, 12, 0x2c, 0x01, 0, 1, 0, 0, 0])).num).toBe(300);
  });

  it('splits the answer into tabs by slot', () => {
    const pages = decodePages(new Uint8Array([0, 2, 1, 5, 14, 0, 0, 0, 1, 0, 0, 0, 0]));
    expect(pages.map(p => p.map(e => e.slot))).toEqual([[5], []]);
  });
});
