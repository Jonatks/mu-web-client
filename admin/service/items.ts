// Items: search definitions, list a character's inventory, insert an item with its options, delete one.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { INVENTORY, type Layout, fits, freeSlot, vaultLayout } from './grid';
import { type Writer, write } from './undo';

type OptionRow = { optionId: string; type: string; number: number; label: string | null };

const NAME = `split_part(d."Name", '||', 1)`;

/** Items by name; `slot` (0-11) keeps only what can be worn in that body slot. */
export async function searchDefinitions(sql: Sql, q = '', group = '', slot = '') {
  const g = group === '' ? -1 : Number(group);
  const s = slot === '' ? -1 : Number(slot);
  return sql.unsafe(
    `SELECT d."Id" AS id, d."Group" AS "group", d."Number" AS number, ${NAME} AS name, d."Width" AS w, d."Height" AS h,
            d."MaximumItemLevel" AS "maxLevel", d."Durability" AS durability, d."SkillId" IS NOT NULL AS "hasSkill"
     FROM config."ItemDefinition" d WHERE ${NAME} ILIKE $1 AND ($2 = -1 OR d."Group" = $2)
       AND ($4 = -1 OR EXISTS (SELECT 1 FROM config."ItemSlotType" t WHERE t."Id" = d."ItemSlotId" AND $4::text = ANY (regexp_split_to_array(trim(both ',' from regexp_replace(t."ItemSlots", '\\D+', ',', 'g')), ','))))
     ORDER BY (${NAME} ILIKE $3) DESC, d."Group", d."Number" LIMIT 150`,
    ['%' + q.replace(/[%_\\]/g, '') + '%', Number.isInteger(g) ? g : -1, q.replace(/[%_\\]/g, '') + '%', Number.isInteger(s) ? s : -1]
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
            i."Durability" AS durability, i."HasSkill" AS skill, d."Width" AS w, d."Height" AS h, i."DefinitionId" AS "definitionId",
            i."SocketCount" AS "socketCount", i."PetExperience" AS "petExperience", d."MaximumItemLevel" AS "maxLevel", d."SkillId" IS NOT NULL AS "canSkill"`;

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

type Spec = { luck?: boolean; option?: number; excellent?: number[] };
type Link = { optionId: string; level: number; kind: 'luck' | 'option' | 'excellent' };

/** The option links a spec asks for, checked against what the item definition can carry. */
export function wantedLinks(opts: OptionRow[], b: Spec): Link[] {
  const links: Link[] = [];
  if (b.luck) {
    const o = opts.find(x => /^Luck/.test(x.type));
    if (!o) throw bad('That item cannot have luck.');
    links.push({ optionId: o.optionId, level: 0, kind: 'luck' });
  }
  if (b.option) {
    if (!Number.isInteger(b.option) || b.option < 1 || b.option > 4) throw bad('option: 1 to 4.');
    const o = opts.find(x => x.type === 'Option');
    if (!o) throw bad('That item cannot have an additional option.');
    links.push({ optionId: o.optionId, level: b.option, kind: 'option' });
  }
  for (const n of new Set(b.excellent ?? [])) {
    const o = opts.find(x => /^Excellent/.test(x.type) && x.number === n);
    if (!o) throw bad(`That item has no excellent option ${n}.`);
    links.push({ optionId: o.optionId, level: 0, kind: 'excellent' });
  }
  return links;
}

/** Equipment slots of the inventory (0-11): left hand, right hand, helm, armor, pants, gloves, boots, wings, pet, pendant, ring, ring. */
export const EQUIP_SLOTS = 12;

/** The body slots an item can be worn in, from its definition. Empty when it cannot be worn. */
async function wearSlots(sql: Sql, definitionId: string): Promise<number[]> {
  const r = await sql`SELECT t."ItemSlots" AS s FROM config."ItemDefinition" d JOIN config."ItemSlotType" t ON t."Id" = d."ItemSlotId" WHERE d."Id" = ${definitionId}::uuid`;
  return String(r[0]?.s ?? '').split(/\D+/).filter(Boolean).map(Number);
}

/** Throws unless the item can be worn in `slot` and the slot is empty. */
async function checkWear(sql: Sql, definitionId: string, slot: number, occupied: { slot: number }[]): Promise<void> {
  if (!(await wearSlots(sql, definitionId)).includes(slot)) throw bad('That item cannot be worn in that slot.');
  if (occupied.some(o => o.slot === slot)) throw bad('That slot already has an item. Take it off first.');
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
  const links = wantedLinks(await definitionOptions(sql, d.id as string), b);
  const bag = store.id
    ? ((await sql`SELECT i."ItemSlot" AS slot, d."Width" AS w, d."Height" AS h FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = ${store.id}`) as unknown as { slot: number; w: number; h: number }[])
    : [];
  let slot: number | null;
  if (t.kind === 'inventory' && b.slot !== undefined && b.slot >= 0 && b.slot < EQUIP_SLOTS) { await checkWear(sql, d.id as string, b.slot, bag); slot = b.slot; }
  else if (b.slot === undefined) slot = freeSlot(bag, d.w as number, d.h as number, store.layout);
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

/** Makes the vault storage of an account that never opened it, the way OpenMU does it lazily. */
async function makeVault(w: Writer, accountId: string, money = 0): Promise<string> {
  await w.save('Account', 'Id', [accountId]);
  const s = await w.tx`INSERT INTO data."ItemStorage" ("Id","Money") VALUES (gen_random_uuid(), ${money}) RETURNING "Id"`;
  const id = s[0]!.Id as string;
  w.created('ItemStorage', [{ Id: id }]);
  await w.tx`UPDATE data."Account" SET "VaultId" = ${id} WHERE "Id" = ${accountId}`;
  return id;
}

type Located = {
  id: string; storage: string; slot: number; level: number; sockets: number; w: number; h: number; max: number; skill: string | null; name: string; def: string;
  char: string | null; charAccount: string | null; login: string | null; accountId: string | null; ext: boolean | null;
};

/** Where an item lives. Only items of a character inventory or an account vault can be edited (not trades or personal stores). */
async function locate(sql: Sql, itemId: string): Promise<Located> {
  const r = await sql`
    SELECT i."Id" AS id, i."ItemStorageId" AS storage, i."ItemSlot" AS slot, i."Level" AS level, i."SocketCount" AS sockets, i."DefinitionId" AS def,
           d."Width" AS w, d."Height" AS h, d."MaximumItemLevel" AS max, d."SkillId" AS skill, split_part(d."Name", '||', 1) AS name,
           c."Name" AS char, c."AccountId" AS "charAccount", a."LoginName" AS login, a."Id" AS "accountId", a."IsVaultExtended" AS ext
    FROM data."Item" i
    JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId"
    LEFT JOIN data."Character" c ON c."InventoryId" = i."ItemStorageId"
    LEFT JOIN data."Account" a ON a."VaultId" = i."ItemStorageId"
    WHERE i."Id" = ${itemId}::uuid`.catch(() => []);
  const it = r[0] as unknown as Located | undefined;
  if (!it) throw missing('No such item.');
  if (!it.char && !it.login) throw bad('That item is not in a character inventory or an account vault.');
  return it;
}

const placedIn = async (sql: Sql, storage: string, except: string) =>
  (await sql`SELECT i."ItemSlot" AS slot, d."Width" AS w, d."Height" AS h FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = ${storage} AND i."Id" <> ${except}::uuid`) as unknown as { slot: number; w: number; h: number }[];

export type ItemEdit = Spec & { level?: number; durability?: number; skill?: boolean; socketCount?: number; petExperience?: number };

/** Edits an item that is already placed: level, durability, skill, luck, additional option, excellent options, sockets, pet experience. */
export async function editItem(sql: Sql, admin: string, itemId: string, b: ItemEdit) {
  const known = ['level', 'durability', 'skill', 'luck', 'option', 'excellent', 'socketCount', 'petExperience'];
  const keys = Object.keys(b);
  if (!keys.length || keys.some(k => !known.includes(k))) throw bad(`Editable fields: ${known.join(', ')}.`);
  const it = await locate(sql, itemId);
  if (b.level !== undefined && (!Number.isInteger(b.level) || b.level < 0 || b.level > it.max)) throw bad(`level: 0 to ${it.max}.`);
  if (b.durability !== undefined && (typeof b.durability !== 'number' || !(b.durability >= 0 && b.durability <= 255))) throw bad('durability: 0 to 255.');
  if (b.skill !== undefined && typeof b.skill !== 'boolean') throw bad('skill: true or false.');
  if (b.skill && !it.skill) throw bad('That item has no skill.');
  if (b.socketCount !== undefined && (!Number.isInteger(b.socketCount) || b.socketCount < 0 || b.socketCount > 5)) throw bad('socketCount: 0 to 5.');
  if (b.petExperience !== undefined && (!Number.isInteger(b.petExperience) || b.petExperience < 0 || b.petExperience > 2147483647)) throw bad('petExperience: a whole number from 0.');
  const touchesOptions = b.luck !== undefined || b.option !== undefined || b.excellent !== undefined;
  const current = touchesOptions
    ? ((await sql`
        SELECT l."Id" AS id, l."ItemOptionId" AS "optionId", l."Level" AS level, split_part(t."Name", '||', 1) AS type, o."Number" AS number
        FROM data."ItemOptionLink" l JOIN config."IncreasableItemOption" o ON o."Id" = l."ItemOptionId" JOIN config."ItemOptionType" t ON t."Id" = o."OptionTypeId"
        WHERE l."ItemId" = ${itemId}::uuid`) as unknown as { id: string; optionId: string; level: number; type: string; number: number }[])
    : [];
  const managed = (t: string) => /^Luck/.test(t) || t === 'Option' || /^Excellent/.test(t);
  let wanted: Link[] = [];
  if (touchesOptions) {
    const spec: Spec = {
      luck: b.luck ?? current.some(l => /^Luck/.test(l.type)),
      option: b.option ?? current.find(l => l.type === 'Option')?.level ?? 0,
      excellent: b.excellent ?? current.filter(l => /^Excellent/.test(l.type)).map(l => l.number),
    };
    wanted = wantedLinks(await definitionOptions(sql, it.def), spec);
  }
  return write(sql, { admin, action: 'item.edit', target: it.char ?? `${it.login} (vault)`, detail: { item: it.name, ...b } }, async w => {
    await w.save('Item', 'Id', [itemId]);
    await w.save('ItemOptionLink', 'ItemId', [itemId]);
    if (b.level !== undefined) await w.tx`UPDATE data."Item" SET "Level" = ${b.level} WHERE "Id" = ${itemId}::uuid`;
    if (b.durability !== undefined) await w.tx`UPDATE data."Item" SET "Durability" = ${b.durability} WHERE "Id" = ${itemId}::uuid`;
    if (b.skill !== undefined) await w.tx`UPDATE data."Item" SET "HasSkill" = ${b.skill} WHERE "Id" = ${itemId}::uuid`;
    if (b.socketCount !== undefined) await w.tx`UPDATE data."Item" SET "SocketCount" = ${b.socketCount} WHERE "Id" = ${itemId}::uuid`;
    if (b.petExperience !== undefined) await w.tx`UPDATE data."Item" SET "PetExperience" = ${b.petExperience} WHERE "Id" = ${itemId}::uuid`;
    if (!touchesOptions) return;
    for (const l of current.filter(c => managed(c.type))) {
      const keep = wanted.find(x => x.optionId === l.optionId);
      if (!keep) await w.tx`DELETE FROM data."ItemOptionLink" WHERE "Id" = ${l.id}::uuid`;
      else if (keep.level !== l.level) await w.tx`UPDATE data."ItemOptionLink" SET "Level" = ${keep.level} WHERE "Id" = ${l.id}::uuid`;
    }
    for (const x of wanted.filter(x => !current.some(c => c.optionId === x.optionId))) {
      const r = await w.tx`INSERT INTO data."ItemOptionLink" ("Id","ItemOptionId","ItemId","Level","Index") VALUES (gen_random_uuid(), ${x.optionId}, ${itemId}::uuid, ${x.level}, 0) RETURNING "Id"`;
      w.created('ItemOptionLink', [{ Id: r[0]!.Id }]);
    }
  });
}

export type ItemMove = { to?: 'inventory' | 'vault'; character?: string; slot?: number };

/** Moves an item inside its storage (new slot) or between a character's inventory and the vault of the same account. */
export async function moveItem(sql: Sql, admin: string, itemId: string, b: ItemMove) {
  const it = await locate(sql, itemId);
  const inInv = !!it.char;
  const to = b.to ?? (inInv ? 'inventory' : 'vault');
  if (to !== 'inventory' && to !== 'vault') throw bad("to: 'inventory' or 'vault'.");
  if (b.slot !== undefined && !Number.isInteger(b.slot)) throw bad('slot: a whole number.');
  let storage: string | null;
  let layout: Layout;
  let accountId: string;
  let charName = it.char;
  if (to === 'vault') {
    accountId = (inInv ? it.charAccount : it.accountId)!;
    const a = (await sql`SELECT "VaultId" AS vault, "IsVaultExtended" AS ext FROM data."Account" WHERE "Id" = ${accountId}`)[0]!;
    storage = a.vault as string | null;
    layout = vaultLayout(!!a.ext);
  } else if (inInv) {
    accountId = it.charAccount!;
    storage = it.storage;
    layout = INVENTORY;
  } else {
    accountId = it.accountId!;
    const c = (await sql`SELECT "Name" AS name, "InventoryId" AS inv FROM data."Character" WHERE "Name" = ${String(b.character ?? '')} AND "AccountId" = ${accountId}`)[0];
    if (!c) throw bad('character: the name of a character of this account.');
    storage = c.inv as string;
    charName = c.name as string;
    layout = INVENTORY;
  }
  const others = storage ? await placedIn(sql, storage, itemId) : [];
  let slot: number | null;
  if (to === 'inventory' && b.slot !== undefined && b.slot >= 0 && b.slot < EQUIP_SLOTS) { await checkWear(sql, it.def, b.slot, others); slot = b.slot; }
  else if (b.slot === undefined) {
    if (storage === it.storage) throw bad('slot: the new slot, when the item stays in the same place.');
    slot = freeSlot(others, it.w, it.h, layout);
  } else slot = fits(others, b.slot, it.w, it.h, layout) ? b.slot : null;
  if (slot === null) throw bad(b.slot === undefined ? 'There is no free space for that item.' : 'The item does not fit in that slot.');
  return write(sql, { admin, action: 'item.move', target: it.char ?? `${it.login} (vault)`, detail: { item: it.name, to, slot, character: charName } }, async w => {
    await w.save('Item', 'Id', [itemId]);
    const dest = storage ?? (await makeVault(w, accountId));
    await w.tx`UPDATE data."Item" SET "ItemStorageId" = ${dest}, "ItemSlot" = ${slot} WHERE "Id" = ${itemId}::uuid`;
    return { slot };
  });
}
