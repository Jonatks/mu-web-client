// Items: search definitions, list a character's inventory, insert an item with its options, delete one.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { INVENTORY, type Layout, fits, freeSlot, vaultLayout } from './grid';
import { write } from './undo';

type OptionRow = { optionId: string; type: string; number: number; label: string | null };

const NAME = `split_part(d."Name", '||', 1)`;

export async function searchDefinitions(sql: Sql, q = '', group = '') {
  const g = group === '' ? -1 : Number(group);
  return sql.unsafe(
    `SELECT d."Id" AS id, d."Group" AS "group", d."Number" AS number, ${NAME} AS name, d."Width" AS w, d."Height" AS h,
            d."MaximumItemLevel" AS "maxLevel", d."Durability" AS durability, d."SkillId" IS NOT NULL AS "hasSkill"
     FROM config."ItemDefinition" d WHERE ${NAME} ILIKE $1 AND ($2 = -1 OR d."Group" = $2)
     ORDER BY (${NAME} ILIKE $3) DESC, d."Group", d."Number" LIMIT 100`,
    ['%' + q.replace(/[%_\\]/g, '') + '%', Number.isInteger(g) ? g : -1, q.replace(/[%_\\]/g, '') + '%']
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

type Target = { kind: 'inventory'; name: string } | { kind: 'vault'; login: string };
type Store = { id: string | null; layout: Layout; accountId?: string };

async function storeOf(sql: Sql, t: Target): Promise<Store> {
  if (t.kind === 'inventory') {
    const r = await sql`SELECT "InventoryId" AS inv FROM data."Character" WHERE "Name" = ${t.name}`;
    if (!r[0]) throw missing('No such character.');
    return { id: r[0].inv as string, layout: INVENTORY };
  }
  const r = await sql`SELECT "Id" AS id, "VaultId" AS vault, "IsVaultExtended" AS ext FROM data."Account" WHERE "LoginName" = ${t.login}`;
  if (!r[0]) throw missing('No such account.');
  return { id: (r[0].vault as string | null) ?? null, layout: vaultLayout(!!r[0].ext), accountId: r[0].id as string };
}

const ITEM_COLUMNS = `i."Id" AS id, i."ItemSlot" AS slot, ${NAME} AS name, d."Group" AS "group", d."Number" AS number, i."Level" AS level,
            i."Durability" AS durability, i."HasSkill" AS skill, d."Width" AS w, d."Height" AS h`;

async function listStorage(sql: Sql, storage: string | null) {
  if (!storage) return [];
  const items = await sql.unsafe(`SELECT ${ITEM_COLUMNS} FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = $1 ORDER BY i."ItemSlot"`, [storage]);
  const links = await sql.unsafe(
    `SELECT l."ItemId" AS "itemId", split_part(t."Name", '||', 1) AS type, o."Number" AS number, l."Level" AS level, ad."Designation" AS label
     FROM data."ItemOptionLink" l JOIN data."Item" i ON i."Id" = l."ItemId" AND i."ItemStorageId" = $1
     JOIN config."IncreasableItemOption" o ON o."Id" = l."ItemOptionId" JOIN config."ItemOptionType" t ON t."Id" = o."OptionTypeId"
     LEFT JOIN config."PowerUpDefinition" p ON p."Id" = o."PowerUpDefinitionId" LEFT JOIN config."AttributeDefinition" ad ON ad."Id" = p."TargetAttributeId"`,
    [storage]
  );
  return items.map(i => ({ ...i, options: links.filter(l => l.itemId === i.id).map(({ itemId: _x, ...o }) => o) }));
}

export async function listItems(sql: Sql, name: string) {
  return listStorage(sql, (await storeOf(sql, { kind: 'inventory', name })).id);
}

/** The vault of an account: its zen, its size and its items. An account that never opened its vault has none yet. */
export async function getVault(sql: Sql, login: string) {
  const s = await storeOf(sql, { kind: 'vault', login });
  const money = s.id ? (await sql`SELECT "Money" AS zen FROM data."ItemStorage" WHERE "Id" = ${s.id}`)[0]?.zen : 0;
  return { zen: Number(money ?? 0), rows: s.layout.rows, cols: s.layout.cols, items: await listStorage(sql, s.id) };
}

export type NewItem = { definitionId: string; level?: number; durability?: number; skill?: boolean; luck?: boolean; option?: number; excellent?: number[]; slot?: number };

export async function addItem(sql: Sql, admin: string, t: Target, b: NewItem) {
  const store = await storeOf(sql, t);
  const who = t.kind === 'inventory' ? t.name : `${t.login} (vault)`;
  const d = (await sql`SELECT "Id" AS id, "Width" AS w, "Height" AS h, "MaximumItemLevel" AS "maxLevel", "Durability" AS durability, "SkillId" AS skill, split_part("Name", '||', 1) AS name FROM config."ItemDefinition" WHERE "Id" = ${String(b.definitionId)}`.catch(() => []))[0];
  if (!d) throw bad('Unknown item definition.');
  const level = b.level ?? 0;
  if (!Number.isInteger(level) || level < 0 || level > (d.maxLevel as number)) throw bad(`level: 0 to ${d.maxLevel}.`);
  const dur = b.durability ?? (d.durability as number);
  if (!Number.isInteger(dur) || dur < 0 || dur > 255) throw bad('durability: 0 to 255.');
  if (b.skill && !d.skill) throw bad('That item has no skill.');
  const opts = await definitionOptions(sql, d.id as string);
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
    const o = opts.find(x => /^Excellent/.test(x.type) && x.number === n);
    if (!o) throw bad(`That item has no excellent option ${n}.`);
    links.push({ optionId: o.optionId, level: 0 });
  }
  const bag = store.id
    ? ((await sql`SELECT i."ItemSlot" AS slot, d."Width" AS w, d."Height" AS h FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = ${store.id}`) as unknown as { slot: number; w: number; h: number }[])
    : [];
  let slot: number | null;
  if (b.slot === undefined) slot = freeSlot(bag, d.w as number, d.h as number, store.layout);
  else slot = fits(bag, b.slot, d.w as number, d.h as number, store.layout) ? b.slot : null;
  if (slot === null) throw bad(b.slot === undefined ? 'There is no free space for that item.' : 'The item does not fit in that slot.');
  return write(sql, { admin, action: t.kind === 'vault' ? 'vault.item.add' : 'item.add', target: who, detail: { item: d.name, level, slot, links: links.length } }, async w => {
    let storage = store.id;
    if (!storage) {
      // First use of this vault: OpenMU makes it lazily, so it is made here the same way (an empty storage the account points to).
      await w.save('Account', 'Id', [store.accountId!]);
      const s = await w.tx`INSERT INTO data."ItemStorage" ("Id","Money") VALUES (gen_random_uuid(), 0) RETURNING "Id"`;
      storage = s[0]!.Id as string;
      w.created('ItemStorage', [{ Id: storage }]);
      await w.tx`UPDATE data."Account" SET "VaultId" = ${storage} WHERE "Id" = ${store.accountId!}`;
    }
    const it = await w.tx`
      INSERT INTO data."Item" ("Id","ItemStorageId","DefinitionId","ItemSlot","Durability","Level","HasSkill","SocketCount","PetExperience")
      VALUES (gen_random_uuid(), ${storage}, ${d.id as string}, ${slot}, ${dur}, ${level}, ${!!b.skill}, 0, 0) RETURNING "Id"`;
    const itemId = it[0]!.Id as string;
    w.created('Item', [{ Id: itemId }]);
    for (const l of links) {
      const r = await w.tx`INSERT INTO data."ItemOptionLink" ("Id","ItemOptionId","ItemId","Level","Index") VALUES (gen_random_uuid(), ${l.optionId}, ${itemId}, ${l.level}, 0) RETURNING "Id"`;
      w.created('ItemOptionLink', [{ Id: r[0]!.Id }]);
    }
    return { itemId, slot };
  });
}

export async function deleteItem(sql: Sql, admin: string, t: Target, itemId: string) {
  const store = await storeOf(sql, t);
  const it = store.id ? (await sql`SELECT "Id" FROM data."Item" WHERE "Id" = ${itemId}::uuid AND "ItemStorageId" = ${store.id}`.catch(() => []))[0] : undefined;
  if (!it) throw missing('That item is not in this storage.');
  return write(sql, { admin, action: t.kind === 'vault' ? 'vault.item.delete' : 'item.delete', target: t.kind === 'vault' ? t.login : t.name, detail: { itemId } }, async w => {
    await w.save('Item', 'Id', [itemId]);
    await w.save('ItemOptionLink', 'ItemId', [itemId]);
    await w.save('ItemItemOfItemSet', 'ItemId', [itemId]);
    await w.tx`DELETE FROM data."Item" WHERE "Id" = ${itemId}::uuid`;
  });
}

/** Sets the zen kept in an account's vault (the storage is made first when the account never opened it). */
export async function setVaultZen(sql: Sql, admin: string, login: string, zen: unknown) {
  if (typeof zen !== 'number' || !Number.isInteger(zen) || zen < 0 || zen > 2147483647) throw bad('zen: a whole number from 0 to 2147483647.');
  const store = await storeOf(sql, { kind: 'vault', login });
  return write(sql, { admin, action: 'vault.zen', target: login, detail: { zen } }, async w => {
    let storage = store.id;
    if (!storage) {
      await w.save('Account', 'Id', [store.accountId!]);
      const s = await w.tx`INSERT INTO data."ItemStorage" ("Id","Money") VALUES (gen_random_uuid(), ${zen}) RETURNING "Id"`;
      storage = s[0]!.Id as string;
      w.created('ItemStorage', [{ Id: storage }]);
      await w.tx`UPDATE data."Account" SET "VaultId" = ${storage} WHERE "Id" = ${store.accountId!}`;
      return;
    }
    await w.save('ItemStorage', 'Id', [storage]);
    await w.tx`UPDATE data."ItemStorage" SET "Money" = ${zen} WHERE "Id" = ${storage}`;
  });
}
