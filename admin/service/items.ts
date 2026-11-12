// Items: search definitions, list a character's inventory, insert an item with its options, delete one.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { freeSlot } from './grid';
import { write } from './undo';

type OptionRow = { optionId: string; type: string; number: number; label: string | null };

const NAME = `split_part(d."Name", '||', 1)`;

export async function searchDefinitions(sql: Sql, q = '', group = '') {
  const g = group === '' ? -1 : Number(group);
  return sql.unsafe(
    `SELECT d."Id" AS id, d."Group" AS "group", d."Number" AS number, ${NAME} AS name, d."Width" AS w, d."Height" AS h,
            d."MaximumItemLevel" AS "maxLevel", d."Durability" AS durability, d."SkillId" IS NOT NULL AS "hasSkill"
     FROM config."ItemDefinition" d WHERE ${NAME} ILIKE $1 AND ($2 = -1 OR d."Group" = $2)
     ORDER BY d."Group", d."Number" LIMIT 100`,
    ['%' + q.replace(/[%_\\]/g, '') + '%', Number.isInteger(g) ? g : -1]
  );
}

/** Options an item can carry: the increasable options of its option definitions, by type. */
export async function definitionOptions(sql: Sql, definitionId: string): Promise<OptionRow[]> {
  const rows = await sql`
    SELECT o."Id" AS "optionId", split_part(t."Name", '||', 1) AS type, o."Number" AS number, ad."Designation" AS label
    FROM config."ItemDefinitionItemOptionDefinition" x
    JOIN config."IncreasableItemOption" o ON o."ItemOptionDefinitionId" = x."ItemOptionDefinitionId"
    JOIN config."ItemOptionType" t ON t."Id" = o."OptionTypeId"
    LEFT JOIN config."PowerUpDefinition" p ON p."Id" = o."PowerUpDefinitionId"
    LEFT JOIN config."AttributeDefinition" ad ON ad."Id" = p."TargetAttributeId"
    WHERE x."ItemDefinitionId" = ${definitionId} ORDER BY t."Name", o."Number"`;
  return rows as unknown as OptionRow[];
}

async function inventoryOf(sql: Sql, name: string): Promise<{ id: string; inv: string }> {
  const r = await sql`SELECT "Id" AS id, "InventoryId" AS inv FROM data."Character" WHERE "Name" = ${name}`;
  if (!r[0]) throw missing('No such character.');
  return r[0] as { id: string; inv: string };
}

export async function listItems(sql: Sql, name: string) {
  const c = await inventoryOf(sql, name);
  const items = await sql.unsafe(
    `SELECT i."Id" AS id, i."ItemSlot" AS slot, ${NAME} AS name, d."Group" AS "group", d."Number" AS number, i."Level" AS level,
            i."Durability" AS durability, i."HasSkill" AS skill, d."Width" AS w, d."Height" AS h
     FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = $1 ORDER BY i."ItemSlot"`,
    [c.inv]
  );
  const links = await sql.unsafe(
    `SELECT l."ItemId" AS "itemId", split_part(t."Name", '||', 1) AS type, o."Number" AS number, l."Level" AS level, ad."Designation" AS label
     FROM data."ItemOptionLink" l JOIN data."Item" i ON i."Id" = l."ItemId" AND i."ItemStorageId" = $1
     JOIN config."IncreasableItemOption" o ON o."Id" = l."ItemOptionId" JOIN config."ItemOptionType" t ON t."Id" = o."OptionTypeId"
     LEFT JOIN config."PowerUpDefinition" p ON p."Id" = o."PowerUpDefinitionId" LEFT JOIN config."AttributeDefinition" ad ON ad."Id" = p."TargetAttributeId"`,
    [c.inv]
  );
  return items.map(i => ({ ...i, options: links.filter(l => l.itemId === i.id).map(({ itemId: _x, ...o }) => o) }));
}

export type NewItem = { definitionId: string; level?: number; durability?: number; skill?: boolean; luck?: boolean; option?: number; excellent?: number[] };

export async function addItem(sql: Sql, admin: string, name: string, b: NewItem) {
  const c = await inventoryOf(sql, name);
  const d = (await sql`SELECT "Id" AS id, "Width" AS w, "Height" AS h, "MaximumItemLevel" AS "maxLevel", "Durability" AS durability, "SkillId" AS skill, split_part("Name", '||', 1) AS name FROM config."ItemDefinition" WHERE "Id" = ${String(b.definitionId)}`.catch(() => []))[0];
  if (!d) throw bad('Unknown item definition.');
  const level = b.level ?? 0;
  if (!Number.isInteger(level) || level < 0 || level > (d.maxLevel as number)) throw bad(`level: 0 to ${d.maxLevel}.`);
  const dur = b.durability ?? (d.durability as number);
  if (!Number.isInteger(dur) || dur < 0 || dur > 255) throw bad('durability: 0 to 255.');
  if (b.skill && !d.skill) throw bad('That item has no skill.');
  const opts = await definitionOptions(sql, d.id as string);
  const of = (type: RegExp, n: number) => opts.find(o => type.test(o.type) && o.number === n);
  const links: { optionId: string; level: number }[] = [];
  if (b.luck) {
    const o = opts.find(x => /^Luck/.test(x.type));
    if (!o) throw bad('That item cannot have luck.');
    links.push({ optionId: o.optionId, level: 0 });
  }
  if (b.option) {
    if (!Number.isInteger(b.option) || b.option < 1 || b.option > 4) throw bad('option: 1 to 4.');
    const o = opts.find(x => x.type === 'Option');
    if (!o) throw bad('That item cannot have an additional option.');
    links.push({ optionId: o.optionId, level: b.option });
  }
  for (const n of new Set(b.excellent ?? [])) {
    const o = of(/^Excellent/, n);
    if (!o) throw bad(`That item has no excellent option ${n}.`);
    links.push({ optionId: o.optionId, level: 0 });
  }
  const bag = (await sql`SELECT i."ItemSlot" AS slot, d."Width" AS w, d."Height" AS h FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = ${c.inv}`) as unknown as { slot: number; w: number; h: number }[];
  const slot = freeSlot(bag, d.w as number, d.h as number);
  if (slot === null) throw bad('The inventory has no free space for that item.');
  return write(sql, { admin, action: 'item.add', target: name, detail: { item: d.name, level, slot, links: links.length } }, async w => {
    const it = await w.tx`
      INSERT INTO data."Item" ("Id","ItemStorageId","DefinitionId","ItemSlot","Durability","Level","HasSkill","SocketCount","PetExperience")
      VALUES (gen_random_uuid(), ${c.inv}, ${d.id as string}, ${slot}, ${dur}, ${level}, ${!!b.skill}, 0, 0) RETURNING "Id"`;
    const itemId = it[0]!.Id as string;
    w.created('Item', [{ Id: itemId }]);
    for (const l of links) {
      const r = await w.tx`INSERT INTO data."ItemOptionLink" ("Id","ItemOptionId","ItemId","Level","Index") VALUES (gen_random_uuid(), ${l.optionId}, ${itemId}, ${l.level}, 0) RETURNING "Id"`;
      w.created('ItemOptionLink', [{ Id: r[0]!.Id }]);
    }
    return { itemId, slot };
  });
}

export async function deleteItem(sql: Sql, admin: string, name: string, itemId: string) {
  const c = await inventoryOf(sql, name);
  const it = (await sql`SELECT "Id" FROM data."Item" WHERE "Id" = ${itemId}::uuid AND "ItemStorageId" = ${c.inv}`.catch(() => []))[0];
  if (!it) throw missing('That item is not in this character inventory.');
  return write(sql, { admin, action: 'item.delete', target: name, detail: { itemId } }, async w => {
    await w.save('Item', 'Id', [itemId]);
    await w.save('ItemOptionLink', 'ItemId', [itemId]);
    await w.save('ItemItemOfItemSet', 'ItemId', [itemId]);
    await w.tx`DELETE FROM data."Item" WHERE "Id" = ${itemId}::uuid`;
  });
}
