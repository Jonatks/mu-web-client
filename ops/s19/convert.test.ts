// Fase 0b: lo que da el convertidor para Bloodangel es lo que la fase 3 cargo a mano. Necesita los XML del S19
// (no estan en el repo): S19_DATA=<carpeta Data del servidor S19>; sin ella la prueba se salta.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GENERATIONS, generationItems, generationMixes, generationSets, itemList } from './convert';

const data = process.env.S19_DATA ?? '';
const here = (f: string) => JSON.parse(readFileSync(join(__dirname, '../bloodangel', f), 'utf8'));

describe.skipIf(!existsSync(join(data, 'Item/ItemList.xml')))('convert (S19_DATA)', () => {
  const read = (f: string) => readFileSync(join(data, 'Item', f), 'utf8');
  const g = GENERATIONS.bloodangel;
  const items = generationItems(itemList(read('ItemList.xml')), g);
  it('picks the 45 Bloodangel items of phase 3, with the same values', () => {
    expect(items).toEqual(here('items_s19.json'));
  });
  it('builds the 7 Bloodangel sets of phase 3', () => {
    expect(generationSets(read('ItemSetOption.xml'), read('ItemSetType.xml'), items, g)).toEqual(here('sets_s19.json'));
  });
  it('finds the Mastery mixes: sealed piece + Ancient Hero\'s Soul at 100 % and 0 Zen, and the +11 Spirit ones', () => {
    const mixes = generationMixes(readFileSync(join(data, 'Mix/MasteryItemMix.xml'), 'utf8'), items);
    const soul = mixes.filter(m => m.materials.some(([c, n]) => c === 13 && n === 407));
    // One per set piece: the 28 pieces of the 7 sets.
    expect(soul.map(m => m.result).sort()).toEqual(here('sets_s19.json').flatMap((x: { pieces: number[][] }) => x.pieces).sort());
    expect(soul.every(m => m.rate === 100 && m.money === 0 && m.optKeep === 24 && m.materials.length === 2)).toBe(true);
    expect(mixes.some(m => m.level === 11 && m.materials.some(([c, n]) => c === 14 && n === 399))).toBe(true);
  });
});
