// Whole ancient sets at once: list the sets with their pieces, and put every piece of one in the inventory (worn or in the
// bag) or the vault. Each piece is an ordinary addItem (own audit line and undo); the places are worked out first, so a
// set that does not fit writes nothing.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { type Layout, type Placed, freeSlot } from './grid';
import { EQUIP_SLOTS, type Target, addItem, definitionOptions, storeOf } from './items';

export type SetPiece = { definitionId: string; name: string; itemOfSetId: string; w: number; h: number; maxLevel: number; skill: boolean; slots: number[] };
export type AncientSetRow = { id: string; name: string; pieces: SetPiece[] };

/** The ancient sets (pieces that carry the set, AncientSetDiscriminator > 0), by name, filtered by `q`. */
export async function listSets(sql: Sql, q = ''): Promise<AncientSetRow[]> {
  const rows = (await sql`
    SELECT g."Id" AS id, split_part(g."Name", '||', 1) AS name, d."Id" AS "definitionId", split_part(d."Name", '||', 1) AS piece,
           s."Id" AS "itemOfSetId", d."Width" AS w, d."Height" AS h, d."MaximumItemLevel" AS "maxLevel", d."SkillId" IS NOT NULL AS skill,
           coalesce(t."ItemSlots", '') AS slots
    FROM config."ItemSetGroup" g JOIN config."ItemOfItemSet" s ON s."ItemSetGroupId" = g."Id" AND s."AncientSetDiscriminator" > 0
    JOIN config."ItemDefinition" d ON d."Id" = s."ItemDefinitionId" LEFT JOIN config."ItemSlotType" t ON t."Id" = d."ItemSlotId"
    WHERE split_part(g."Name", '||', 1) ILIKE ${'%' + q + '%'} ORDER BY 2, d."Group", d."Number"`) as unknown as Record<string, unknown>[];
  const out = new Map<string, AncientSetRow>();
  for (const r of rows) {
    const set = out.get(r.id as string) ?? { id: r.id as string, name: r.name as string, pieces: [] };
    set.pieces.push({
      definitionId: r.definitionId as string, name: r.piece as string, itemOfSetId: r.itemOfSetId as string, w: r.w as number, h: r.h as number,
      maxLevel: r.maxLevel as number, skill: !!r.skill, slots: String(r.slots).split(/\D+/).filter(Boolean).map(Number),
    });
    out.set(set.id, set);
  }
  return [...out.values()];
}

/**
 * Where each piece goes: with `wear`, the first body slot it can be worn in that is free (two rings take 10 and 11,
 * two weapons 0 and 1); otherwise, and for a piece that cannot be worn, the first free place of the bag or vault.
 * Throws naming the piece that has no place, before anything is written.
 */
export function planSet(pieces: Pick<SetPiece, 'name' | 'w' | 'h' | 'slots'>[], bag: Placed[], layout: Layout, wear: boolean): number[] {
  const taken = new Set(bag.filter(b => b.slot < EQUIP_SLOTS && layout.first > 0).map(b => b.slot));
  const placed = [...bag];
  return pieces.map(p => {
    const body = wear ? p.slots.find(s => s < EQUIP_SLOTS && !taken.has(s)) : undefined;
    if (wear && p.slots.length && body === undefined) throw bad(`${p.name}: its body slot is taken. Take that item off first.`);
    if (body !== undefined) { taken.add(body); return body; }
    const slot = freeSlot(placed, p.w, p.h, layout);
    if (slot === null) throw bad(`There is no free space for ${p.name}.`);
    placed.push({ slot, w: p.w, h: p.h });
    return slot;
  });
}

export type NewSet = { setId: string; level?: number; luck?: boolean; option?: number; skill?: boolean; bonusLevel?: number; wear?: boolean };

/** Adds every piece of a set to `t`. Level, luck, option and skill go on each piece that can carry them. */
export async function addSet(sql: Sql, admin: string, t: Target, b: NewSet) {
  const set = (await listSets(sql)).find(s => s.id === b.setId);
  if (!set) throw missing('Unknown ancient set.');
  const store = await storeOf(sql, t);
  const bag = store.id
    ? ((await sql`SELECT i."ItemSlot" AS slot, d."Width" AS w, d."Height" AS h FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = ${store.id}`) as unknown as Placed[])
    : [];
  const slots = planSet(set.pieces, bag, store.layout, !!b.wear && t.kind === 'inventory');
  const added: { name: string; itemId: string; slot: number }[] = [];
  for (const [i, p] of set.pieces.entries()) {
    const opts = await definitionOptions(sql, p.definitionId);
    const r = await addItem(sql, admin, t, {
      definitionId: p.definitionId, slot: slots[i], level: Math.min(b.level ?? 0, p.maxLevel), skill: !!b.skill && p.skill,
      luck: !!b.luck && opts.some(o => /^Luck/.test(o.type)), option: opts.some(o => o.type === 'Option') ? b.option : undefined,
      ancient: { itemOfSetId: p.itemOfSetId, bonusLevel: b.bonusLevel },
    });
    added.push({ name: p.name, itemId: r.result.itemId, slot: r.result.slot });
  }
  return { set: set.name, added };
}

