// Fase 0b: lee los XML del servidor S19 (ItemList, ItemSetType, ItemSetOption) y da los items y sets de una generacion
// en el formato que usan los generadores de ops/bloodangel (items_s19.json y sets_s19.json), y sus mezclas Mastery.
//   bun ops/s19/convert.ts <carpeta Data del servidor S19> <generacion> <carpeta de salida>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import equivalencias from './equivalencias.json';
import generaciones from './generaciones.json';

type Attrs = Record<string, string>;
export type S19Item = { cat: number; catname: string; [field: string]: string | number };
export type S19Set = { s19: number; name: string; stat: string; pieces: [number, number][]; tiers: [number, number][][]; full: [number, number][] };
type Generation = { masteryGrade: number; groups: [number, number]; exclude: string[]; sets: number[] };

const EQ: { s6Classes: string[]; classStat: Record<string, string> } = equivalencias;
export const GENERATIONS = generaciones as unknown as Record<string, Generation>;

const attrs = (s: string): Attrs => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const noComments = (xml: string) => xml.replace(/<!--[\s\S]*?-->/g, '');

/** Each `<Tag .../>` with the attributes of its `<Category>`. */
function rows(xml: string, tag: string): { cat: Attrs; row: Attrs }[] {
  const out: { cat: Attrs; row: Attrs }[] = [];
  let cat: Attrs = {};
  for (const m of noComments(xml).matchAll(new RegExp(`<(Category|${tag})\\b([^>]*?)/?>`, 'g'))) {
    if (m[1] === 'Category') cat = attrs(m[2]);
    else out.push({ cat, row: attrs(m[2]) });
  }
  return out;
}

export function itemList(xml: string): S19Item[] {
  return rows(xml, 'Item').map(({ cat, row }) => ({ ...row, cat: Number(cat.Index), catname: cat.Name }));
}

const excluded = (g: Generation, cat: number, index: string) =>
  g.exclude.some(e => { const [c, n] = e.split('/'); return (c === '*' || Number(c) === cat) && n === index; });

/** The generation's equipment that a Season 6 class can wear, as the phase 3 picked it by hand. */
export function generationItems(items: S19Item[], g: Generation): S19Item[] {
  return items.filter(a => Number(a.MasteryGrade) === g.masteryGrade && a.cat >= g.groups[0] && a.cat <= g.groups[1]
    && EQ.s6Classes.some(c => (a[c] ?? '0') !== '0') && !excluded(g, a.cat, String(a.Index)));
}

/** S19 set id -> its pieces, from ItemSetType (AncientId1..3). */
export function setPieces(xml: string): Map<number, [number, number][]> {
  const out = new Map<number, [number, number][]>();
  for (const { cat, row } of rows(xml, 'Item')) {
    for (const k of ['AncientId1', 'AncientId2', 'AncientId3']) {
      const id = Number(row[k] ?? 0);
      if (id > 0) out.set(id, [...(out.get(id) ?? []), [Number(cat.Index), Number(row.Index)]]);
    }
  }
  return out;
}

const pair = (r: Attrs, o: string, v: string): [number, number][] => (Number(r[o] ?? -1) >= 0 ? [[Number(r[o]), Number(r[v])]] : []);

export function generationSets(optionXml: string, typeXml: string, items: S19Item[], g: Generation): S19Set[] {
  const options = new Map(rows(optionXml, 'Data').map(({ row }) => [Number(row.ID), row]));
  const pieces = setPieces(typeXml);
  return g.sets.map(id => {
    const r = options.get(id);
    if (!r) throw new Error(`set ${id} sin opciones`);
    const own = (pieces.get(id) ?? []).filter(([c, n]) => items.some(a => a.cat === c && Number(a.Index) === n));
    const cls = EQ.s6Classes.find(c => items.some(a => a.cat === own[0]?.[0] && Number(a.Index) === own[0]?.[1] && a[c] !== '0'));
    const tiers = [2, 3, 4, 5, 6, 7].map(t => [...pair(r, `Option${t}_1`, `Value${t}_1`), ...pair(r, `Option${t}_2`, `Value${t}_2`)]).filter(t => t.length);
    const full = Array.from({ length: 10 }, (_, i) => pair(r, `FullOption${i + 1}`, `FullValue${i + 1}`)).flat();
    return { s19: id, name: r.Name.replace(/'s$/, ''), stat: EQ.classStat[cls ?? ''], pieces: own, tiers, full };
  });
}

export type S19Mix = { id: number; result: [number, number]; level: number; optKeep: number; rate: number; money: number; materials: [number, number, number][] };

/** The MasteryItemMix recipes whose result is one of the generation's items. */
export function generationMixes(xml: string, items: S19Item[]): S19Mix[] {
  const clean = noComments(xml);
  const mats = new Map([...clean.matchAll(/<Material\b([^>]*?)\/>/g)].map(m => attrs(m[1])).map(a => [a.ID, a]));
  return [...clean.matchAll(/<Mix\b([^>]*?)\/>/g)].map(m => attrs(m[1]))
    .filter(a => items.some(i => i.cat === Number(a.Cat) && Number(i.Index) === Number(a.Index)))
    .map(a => ({
      id: Number(a.ID), result: [Number(a.Cat), Number(a.Index)], level: Number(a.Level), optKeep: Number(a.OptKeepType),
      rate: Number(a.SuccessRate), money: Number(a.Money ?? 0),
      materials: [1, 2, 3, 4, 5, 6].flatMap(n => {
        const mat = mats.get(a[`MaterialID${n}`]);
        return mat ? [[Number(mat.Cat), Number(mat.Index), Number(a[`MaterialCnt${n}`])] as [number, number, number]] : [];
      }),
    }));
}

if (import.meta.main) {
  const [data, gen, out] = process.argv.slice(2);
  const g = GENERATIONS[gen ?? ''];
  if (!data || !g || !out) throw new Error('uso: convert.ts <Data S19> <generacion> <salida>');
  const read = (f: string) => readFileSync(join(data, 'Item', f), 'utf8');
  const items = generationItems(itemList(read('ItemList.xml')), g);
  const sets = generationSets(read('ItemSetOption.xml'), read('ItemSetType.xml'), items, g);
  const mixes = generationMixes(readFileSync(join(data, 'Mix', 'MasteryItemMix.xml'), 'utf8'), items);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'mixes_s19.json'), JSON.stringify(mixes).replace(/},{/g, '},\n{'));
  writeFileSync(join(out, 'items_s19.json'), JSON.stringify(items, null, 0).replace(/},{/g, '},\n{'));
  writeFileSync(join(out, 'sets_s19.json'), JSON.stringify(sets));
  process.stdout.write(`${gen}: ${items.length} items, ${sets.length} sets, ${mixes.length} mezclas\n`);
}
