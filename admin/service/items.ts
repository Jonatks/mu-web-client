// Items: search definitions, list a character's inventory, insert an item with its options, delete one.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { gate, lineOfCharacter, lineOfClass } from './classline';
import { INVENTORY, type Layout, fits, freeSlot, vaultLayout } from './grid';
import { type Writer, write } from './undo';

type OptionRow = { optionId: string; type: string; number: number; label: string | null };

const NAME = `split_part(d."Name", '||', 1)`;

/** Category labels in the order the picker shows them. Keys come from `CAT` below. */
export const CATEGORIES: [string, string][] = [
  ['g0', 'Espadas'], ['g1', 'Hachas'], ['g2', 'Mazas'], ['g3', 'Lanzas'], ['g4', 'Arcos y ballestas'], ['g5', 'Bastones'], ['g6', 'Escudos'],
  ['g7', 'Cascos'], ['g8', 'Armaduras'], ['g9', 'Pantalones'], ['g10', 'Guantes'], ['g11', 'Botas'],
  ['wings', 'Alas y capas'], ['pets', 'Mascotas'], ['pendants', 'Collares'], ['rings', 'Anillos'], ['orbs', 'Orbes y piedras'],
  ['other13', 'Otros especiales'], ['g14', 'Pociones, jewels y cajas'], ['g15', 'Pergaminos'],
];

const SLOTS = `regexp_split_to_array(trim(both ',' from regexp_replace(t."ItemSlots", '\\D+', ',', 'g')), ',')`;
/** The category of a definition (needs `t` = its ItemSlotType, left-joined). */
const CAT = `(CASE WHEN d."Group" = 12 AND '7' = ANY (${SLOTS}) THEN 'wings' WHEN d."Group" = 12 THEN 'orbs'
  WHEN d."Group" = 13 AND '8' = ANY (${SLOTS}) THEN 'pets' WHEN d."Group" = 13 AND '9' = ANY (${SLOTS}) THEN 'pendants'
  WHEN d."Group" = 13 AND ('10' = ANY (${SLOTS}) OR '11' = ANY (${SLOTS})) THEN 'rings' WHEN d."Group" = 13 THEN 'other13'
  ELSE 'g' || d."Group" END)`;

/** The shared filters: body slot (0-11) and, with a character, only what its class line can use. */
const FROM = `FROM config."ItemDefinition" d LEFT JOIN config."ItemSlotType" t ON t."Id" = d."ItemSlotId"`;
const FILTER = `($1 = -1 OR EXISTS (SELECT 1 WHERE $1::text = ANY (${SLOTS})))
  AND ($2::uuid[] IS NULL OR NOT EXISTS (SELECT 1 FROM config."ItemDefinitionCharacterClass" ic WHERE ic."ItemDefinitionId" = d."Id")
       OR EXISTS (SELECT 1 FROM config."ItemDefinitionCharacterClass" ic WHERE ic."ItemDefinitionId" = d."Id" AND ic."CharacterClassId" = ANY($2::uuid[])))`;

/** The class line to filter by: a character's, or (when none is given) the line of a base class number such as 0 for Dark Wizard. */
async function lineFor(sql: Sql, character: string, base: string) {
  if (character) return lineOfCharacter(sql, character);
  if (!/^\d{1,3}$/.test(base)) return null;
  const c = (await sql`SELECT "Id" AS id FROM config."CharacterClass" WHERE "Number" = ${Number(base)} LIMIT 1`)[0];
  return c ? lineOfClass(sql, c.id as string) : null;
}

async function filterArgs(sql: Sql, slot: string, character: string, base = '') {
  const line = await lineFor(sql, character, base);
  const s = slot === '' ? -1 : Number(slot);
  return { line, args: [Number.isInteger(s) ? s : -1, line ? `{${line.ids.join(',')}}` : null] };
}

/** Items by name; `cat` is a category key, `slot` (0-11) keeps only what can be worn there. */
export async function searchDefinitions(sql: Sql, q = '', group = '', slot = '', character = '', cat = '', base = '') {
  const { line, args } = await filterArgs(sql, slot, character, base);
  const g = group === '' ? -1 : Number(group);
  const clean = q.replace(/[%_\\]/g, '');
  const rows = await sql.unsafe(
    `SELECT d."Id" AS id, d."Group" AS "group", d."Number" AS number, ${NAME} AS name, d."Width" AS w, d."Height" AS h, ${CAT} AS cat,
            d."MaximumItemLevel" AS "maxLevel", d."Durability" AS durability, d."SkillId" IS NOT NULL AS "hasSkill",
            ARRAY(SELECT ic."CharacterClassId"::text FROM config."ItemDefinitionCharacterClass" ic WHERE ic."ItemDefinitionId" = d."Id") AS classes
     ${FROM} WHERE ${FILTER} AND ${NAME} ILIKE $3 AND ($4 = -1 OR d."Group" = $4) AND ($6 = '' OR ${CAT} = $6)
     ORDER BY (${NAME} ILIKE $5) DESC, d."Group", d."Number" LIMIT 150`,
    [...args, '%' + clean + '%', Number.isInteger(g) ? g : -1, clean + '%', cat]
  );
  return rows.map(r => {
    const g = line ? gate(line, r.classes as string[]) : null;
    const { classes: _c, ...rest } = r;
    return { ...rest, requires: g?.requires ?? null, needsEvolve: g?.needsEvolve ?? false };
  });
}

/** The categories this server has items in (for the character's class line and body slot), with counts. */
export async function itemCategories(sql: Sql, slot = '', character = '', base = '') {
  const { args } = await filterArgs(sql, slot, character, base);
  const rows = await sql.unsafe(`SELECT ${CAT} AS cat, count(*)::int AS n ${FROM} WHERE ${FILTER} GROUP BY 1`, args);
  const n = new Map(rows.map(r => [r.cat as string, r.n as number]));
  return CATEGORIES.filter(([k]) => n.has(k)).map(([key, name]) => ({ key, name, count: n.get(key)! }));
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

type Target = { kind: 'inventory'; name: string } | { kind: 'vault'; login: string } | { kind: 'shop'; monsterId: string };
export const SHOP: Layout = { first: 0, cols: 8, rows: 15 };
const who = (t: Target) => (t.kind === 'inventory' ? t.name : t.kind === 'vault' ? `${t.login} (vault)` : `shop ${t.monsterId}`);
const act = (t: Target, what: 'add' | 'delete') => `${t.kind === 'inventory' ? 'item' : t.kind === 'vault' ? 'vault.item' : 'shop.item'}.${what}`;
type Store = { id: string | null; layout: Layout; accountId?: string };

async function storeOf(sql: Sql, t: Target): Promise<Store> {
  if (t.kind === 'inventory') {
    const r = await sql`SELECT "InventoryId" AS inv FROM data."Character" WHERE "Name" = ${t.name}`;
    if (!r[0]) throw missing('No such character.');
    return { id: r[0].inv as string, layout: INVENTORY };
  }
  if (t.kind === 'shop') {
    const r = await sql`SELECT "MerchantStoreId" AS store FROM config."MonsterDefinition" WHERE "Id" = ${t.monsterId}::uuid`;
    if (!r[0]?.store) throw missing('That NPC has no shop.');
    return { id: r[0].store as string, layout: SHOP };
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
    `SELECT l."ItemId" AS "itemId", l."ItemOptionId" AS "optionId", split_part(t."Name", '||', 1) AS type, o."Number" AS number, l."Level" AS level, ad."Designation" AS label
     FROM data."ItemOptionLink" l JOIN data."Item" i ON i."Id" = l."ItemId" AND i."ItemStorageId" = $1
     JOIN config."IncreasableItemOption" o ON o."Id" = l."ItemOptionId" JOIN config."ItemOptionType" t ON t."Id" = o."OptionTypeId"
     LEFT JOIN config."PowerUpDefinition" p ON p."Id" = o."PowerUpDefinitionId" LEFT JOIN config."AttributeDefinition" ad ON ad."Id" = p."TargetAttributeId"`,
    [storage]
  );
  const sets = await sql.unsafe(
    `SELECT j."ItemId" AS "itemId", s."Id" AS "itemOfSetId", split_part(g."Name", '||', 1) AS set, s."BonusOptionId" AS "bonusOptionId"
     FROM data."ItemItemOfItemSet" j JOIN data."Item" i ON i."Id" = j."ItemId" AND i."ItemStorageId" = $1
     JOIN config."ItemOfItemSet" s ON s."Id" = j."ItemOfItemSetId" JOIN config."ItemSetGroup" g ON g."Id" = s."ItemSetGroupId"`,
    [storage]
  );
  return items.map(i => {
    const mine = links.filter(l => l.itemId === i.id);
    const a = sets.find(x => x.itemId === i.id);
    const ancient = a ? { itemOfSetId: a.itemOfSetId as string, set: a.set as string, bonusLevel: (mine.find(l => l.optionId === a.bonusOptionId)?.level as number | undefined) ?? 0 } : null;
    return { ...i, ancient, options: mine.map(({ itemId: _x, optionId: _o, ...o }) => o) };
  });
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

/** What an NPC sells: the items of its merchant store. */
export async function getShop(sql: Sql, monsterId: string) {
  const s = await storeOf(sql, { kind: 'shop', monsterId });
  const name = (await sql`SELECT split_part("Designation", '||', 1) AS name FROM config."MonsterDefinition" WHERE "Id" = ${monsterId}::uuid`)[0]?.name;
  return { name, rows: s.layout.rows, cols: s.layout.cols, items: await listStorage(sql, s.id) };
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

/** One ancient set an item can belong to: the row linking the item to the set, and the bonus option the set gives (+5 / +10). */
export type AncientSet = { itemOfSetId: string; set: string; bonusOptionId: string | null; bonus: string | null };
/** What a request asks for: a set the item can be in and the bonus level (1 is +5, 2 is +10). */
export type AncientPick = { itemOfSetId: string; bonusLevel?: number };
export const BONUS_LEVELS = [1, 2];

/** The ancient sets a definition can be in (rings and pendants too), by set name. */
export async function ancientSetsOf(sql: Sql, definitionId: string): Promise<AncientSet[]> {
  const rows = await sql`
    SELECT s."Id" AS "itemOfSetId", split_part(g."Name", '||', 1) AS set, s."BonusOptionId" AS "bonusOptionId", ad."Designation" AS bonus
    FROM config."ItemOfItemSet" s JOIN config."ItemSetGroup" g ON g."Id" = s."ItemSetGroupId"
    LEFT JOIN config."IncreasableItemOption" o ON o."Id" = s."BonusOptionId"
    LEFT JOIN config."PowerUpDefinition" p ON p."Id" = o."PowerUpDefinitionId" LEFT JOIN config."AttributeDefinition" ad ON ad."Id" = p."TargetAttributeId"
    WHERE s."ItemDefinitionId" = ${definitionId}::uuid AND s."AncientSetDiscriminator" > 0 ORDER BY 2`.catch(() => []);
  return rows as unknown as AncientSet[];
}

/** Checks an ancient request against the sets the item can be in. The bonus level is only kept when the set has a bonus. */
export function ancientPlan(sets: AncientSet[], pick: AncientPick): { itemOfSetId: string; bonusOptionId: string | null; level: number } {
  const s = sets.find(x => x.itemOfSetId === pick?.itemOfSetId);
  if (!s) throw bad('That item is not part of that ancient set.');
  if (!s.bonusOptionId) return { itemOfSetId: s.itemOfSetId, bonusOptionId: null, level: 0 };
  const level = pick.bonusLevel ?? 1;
  if (!BONUS_LEVELS.includes(level)) throw bad('bonusLevel: 1 (+5) or 2 (+10).');
  return { itemOfSetId: s.itemOfSetId, bonusOptionId: s.bonusOptionId, level };
}

type Plan = ReturnType<typeof ancientPlan>;

/** Links an item to its ancient set and gives it the bonus option (inside a write). */
async function insertAncient(w: Writer, itemId: string, a: Plan) {
  await w.tx`INSERT INTO data."ItemItemOfItemSet" ("ItemId","ItemOfItemSetId") VALUES (${itemId}::uuid, ${a.itemOfSetId}::uuid)`;
  w.created('ItemItemOfItemSet', [{ ItemId: itemId, ItemOfItemSetId: a.itemOfSetId }]);
  if (!a.bonusOptionId) return;
  const r = await w.tx`INSERT INTO data."ItemOptionLink" ("Id","ItemOptionId","ItemId","Level","Index") VALUES (gen_random_uuid(), ${a.bonusOptionId}::uuid, ${itemId}::uuid, ${a.level}, 0) RETURNING "Id"`;
  w.created('ItemOptionLink', [{ Id: r[0]!.Id }]);
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

export type NewItem = { definitionId: string; level?: number; durability?: number; skill?: boolean; luck?: boolean; option?: number; excellent?: number[]; slot?: number; ancient?: AncientPick };

export async function addItem(sql: Sql, admin: string, t: Target, b: NewItem) {
  const store = await storeOf(sql, t);
  const d = (await sql`SELECT "Id" AS id, "Width" AS w, "Height" AS h, "MaximumItemLevel" AS "maxLevel", "Durability" AS durability, "SkillId" AS skill, split_part("Name", '||', 1) AS name FROM config."ItemDefinition" WHERE "Id" = ${String(b.definitionId)}`.catch(() => []))[0];
  if (!d) throw bad('Unknown item definition.');
  const level = b.level ?? 0;
  if (!Number.isInteger(level) || level < 0 || level > (d.maxLevel as number)) throw bad(`level: 0 to ${d.maxLevel}.`);
  const dur = b.durability ?? (d.durability as number);
  if (!Number.isInteger(dur) || dur < 0 || dur > 255) throw bad('durability: 0 to 255.');
  if (b.skill && !d.skill) throw bad('That item has no skill.');
  const links = wantedLinks(await definitionOptions(sql, d.id as string), b);
  const ancient = b.ancient ? ancientPlan(await ancientSetsOf(sql, d.id as string), b.ancient) : null;
  const bag = store.id
    ? ((await sql`SELECT i."ItemSlot" AS slot, d."Width" AS w, d."Height" AS h FROM data."Item" i JOIN config."ItemDefinition" d ON d."Id" = i."DefinitionId" WHERE i."ItemStorageId" = ${store.id}`) as unknown as { slot: number; w: number; h: number }[])
    : [];
  let slot: number | null;
  if (t.kind === 'inventory' && b.slot !== undefined && b.slot >= 0 && b.slot < EQUIP_SLOTS) { await checkWear(sql, d.id as string, b.slot, bag); slot = b.slot; }
  else if (b.slot === undefined) slot = freeSlot(bag, d.w as number, d.h as number, store.layout);
  else slot = fits(bag, b.slot, d.w as number, d.h as number, store.layout) ? b.slot : null;
  if (slot === null) throw bad(b.slot === undefined ? 'There is no free space for that item.' : 'The item does not fit in that slot.');
  return write(sql, { admin, action: act(t, 'add'), target: who(t), detail: { item: d.name, level, slot, links: links.length, ...(ancient ? { ancient: ancient.itemOfSetId, bonus: ancient.level } : {}) } }, async w => {
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
    if (ancient) await insertAncient(w, itemId, ancient);
    return { itemId, slot };
  });
}

export async function deleteItem(sql: Sql, admin: string, t: Target, itemId: string) {
  const store = await storeOf(sql, t);
  const it = store.id ? (await sql`SELECT "Id" FROM data."Item" WHERE "Id" = ${itemId}::uuid AND "ItemStorageId" = ${store.id}`.catch(() => []))[0] : undefined;
  if (!it) throw missing('That item is not in this storage.');
  return write(sql, { admin, action: act(t, 'delete'), target: who(t), detail: { itemId } }, async w => {
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

export type ItemEdit = Spec & { ancient?: AncientPick | null; level?: number; durability?: number; skill?: boolean; socketCount?: number; petExperience?: number };

/** Edits an item that is already placed: level, durability, skill, luck, additional option, excellent options, sockets, pet experience. */
export async function editItem(sql: Sql, admin: string, itemId: string, b: ItemEdit) {
  const known = ['level', 'durability', 'skill', 'luck', 'option', 'excellent', 'socketCount', 'petExperience', 'ancient'];
  const keys = Object.keys(b);
  if (!keys.length || keys.some(k => !known.includes(k))) throw bad(`Editable fields: ${known.join(', ')}.`);
  const it = await locate(sql, itemId);
  if (b.level !== undefined && (!Number.isInteger(b.level) || b.level < 0 || b.level > it.max)) throw bad(`level: 0 to ${it.max}.`);
  if (b.durability !== undefined && (typeof b.durability !== 'number' || !(b.durability >= 0 && b.durability <= 255))) throw bad('durability: 0 to 255.');
  if (b.skill !== undefined && typeof b.skill !== 'boolean') throw bad('skill: true or false.');
  if (b.skill && !it.skill) throw bad('That item has no skill.');
  if (b.socketCount !== undefined && (!Number.isInteger(b.socketCount) || b.socketCount < 0 || b.socketCount > 5)) throw bad('socketCount: 0 to 5.');
  if (b.petExperience !== undefined && (!Number.isInteger(b.petExperience) || b.petExperience < 0 || b.petExperience > 2147483647)) throw bad('petExperience: a whole number from 0.');
  const ancient = b.ancient ? ancientPlan(await ancientSetsOf(sql, it.def), b.ancient) : null;
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
    if (b.ancient !== undefined) {
      // The old set row and its bonus link go, the new ones are made (null takes the item out of its set).
      const old = await w.tx`SELECT j."ItemOfItemSetId" AS id, s."BonusOptionId" AS bonus FROM data."ItemItemOfItemSet" j JOIN config."ItemOfItemSet" s ON s."Id" = j."ItemOfItemSetId" WHERE j."ItemId" = ${itemId}::uuid`;
      await w.save('ItemItemOfItemSet', 'ItemId', [itemId]);
      for (const o of old) {
        if (o.bonus) await w.tx`DELETE FROM data."ItemOptionLink" WHERE "ItemId" = ${itemId}::uuid AND "ItemOptionId" = ${o.bonus as string}::uuid`;
      }
      await w.tx`DELETE FROM data."ItemItemOfItemSet" WHERE "ItemId" = ${itemId}::uuid`;
      if (ancient) await insertAncient(w, itemId, ancient);
    }
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
