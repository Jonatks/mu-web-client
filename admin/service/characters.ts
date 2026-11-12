// Characters: list, read, edit level / stats / zen. Level is a StatAttribute; zen is the money of the inventory storage.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { experienceFor } from './exp';
import { columnsOf, refuseIfUsed } from './schema';
import { write } from './undo';

const STATS = { strength: 'Base Strength', agility: 'Base Agility', vitality: 'Base Vitality', energy: 'Base Energy', leadership: 'Base Leadership' } as const;
/** Counters that a character may not have a row for yet; they are created on the first edit. */
const COUNTERS = { masterLevel: 'Master Level', resets: 'Resets' } as const;
export const MAX_LEVEL = 400;
export const MAX_STAT = 32767;
export const MAX_ZEN = 2147483647;

const baseSql = (extra: string) => `
  SELECT c."Id" AS id, c."Name" AS name, a."LoginName" AS account, split_part(k."Name", '||', 1) AS class,
         split_part(m."Name", '||', 1) AS map, c."LevelUpPoints" AS "levelUpPoints", c."Experience" AS experience, s."Money" AS zen,
         c."InventoryId" AS "inventoryId", c."CharacterSlot" AS slot, c."CurrentMapId" AS "mapId",
         c."PositionX"::int AS x, c."PositionY"::int AS y, c."PlayerKillCount" AS pk, c."MasterLevelUpPoints" AS "masterPoints", c."CharacterClassId" AS "classId",${extra}
         COALESCE((SELECT sa."Value" FROM data."StatAttribute" sa JOIN config."AttributeDefinition" d ON d."Id" = sa."DefinitionId"
                   WHERE sa."CharacterId" = c."Id" AND d."Designation" = 'Level'), 0)::int AS level
  FROM data."Character" c
  JOIN data."Account" a ON a."Id" = c."AccountId"
  JOIN config."CharacterClass" k ON k."Id" = c."CharacterClassId"
  LEFT JOIN config."GameMapDefinition" m ON m."Id" = c."CurrentMapId"
  LEFT JOIN data."ItemStorage" s ON s."Id" = c."InventoryId"`;

/** Columns that only some OpenMU versions have, offered when they exist. */
const OPTIONAL = { status: 'CharacterStatus', heroState: 'State', heroSeconds: 'StateRemainingSeconds', fruitPoints: 'UsedFruitPoints', negFruitPoints: 'UsedNegFruitPoints', inventoryExtensions: 'InventoryExtensions', masterExperience: 'MasterExperience' } as const;
async function base(sql: Sql): Promise<string> {
  const cols = await columnsOf(sql, 'Character');
  return baseSql(Object.entries(OPTIONAL).filter(([, c]) => cols.has(c)).map(([k, c]) => ` c."${c}"::float8 AS "${k}",`).join(''));
}

export async function listCharacters(sql: Sql, q = '', account = '') {
  return sql.unsafe(`${await base(sql)} WHERE c."Name" ILIKE $1 AND ($2 = '' OR a."LoginName" = $2) ORDER BY a."LoginName", c."CharacterSlot" LIMIT 200`, ['%' + q.replace(/[%_\\]/g, '') + '%', account]);
}

export async function listMaps(sql: Sql) {
  return sql`SELECT "Id" AS id, split_part("Name", '||', 1) AS name FROM config."GameMapDefinition" ORDER BY "Number"`;
}

export async function getCharacter(sql: Sql, name: string) {
  const r = await sql.unsafe(`${await base(sql)} WHERE c."Name" = $1`, [name]);
  const c = r[0];
  if (!c) throw missing('No such character.');
  const stats = await sql`
    SELECT d."Designation" AS d, sa."Value"::int AS v FROM data."StatAttribute" sa JOIN config."AttributeDefinition" d ON d."Id" = sa."DefinitionId"
    WHERE sa."CharacterId" = ${c.id as string} AND d."Designation" IN ${sql([...Object.values(STATS), ...Object.values(COUNTERS)])}`;
  const by = new Map(stats.map(s => [s.d as string, s.v as number]));
  const out: Record<string, number | null> = {};
  for (const [k, des] of Object.entries(STATS)) out[k] = by.get(des) ?? null;
  for (const [k, des] of Object.entries(COUNTERS)) out[k] = by.get(des) ?? 0;
  return { ...c, ...out };
}

const int = (v: unknown, name: string, min: number, max: number): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw bad(`${name}: a whole number from ${min} to ${max}.`);
  return v;
};

/** Edits only the fields sent. The caller has already checked that nobody is connected. */
export async function patchCharacter(sql: Sql, admin: string, name: string, body: Record<string, unknown>) {
  const c = await getCharacter(sql, name);
  const known = ['level', 'zen', 'levelUpPoints', 'mapId', 'x', 'y', 'pk', 'masterPoints', 'name', 'classId', 'experience', ...Object.keys(OPTIONAL), ...Object.keys(STATS), ...Object.keys(COUNTERS)];
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some(k => !known.includes(k))) throw bad(`Editable fields: ${known.join(', ')}.`);
  const detail: Record<string, unknown> = {};
  const level = body.level === undefined ? null : int(body.level, 'level', 1, MAX_LEVEL);
  const zen = body.zen === undefined ? null : int(body.zen, 'zen', 0, MAX_ZEN);
  const lup = body.levelUpPoints === undefined ? null : int(body.levelUpPoints, 'levelUpPoints', 0, 1_000_000);
  const mapId = body.mapId === undefined ? null : String(body.mapId);
  if (mapId !== null && !(await listMaps(sql)).some(m => m.id === mapId)) throw bad('mapId: not a known map.');
  const x = body.x === undefined ? null : int(body.x, 'x', 0, 255);
  const y = body.y === undefined ? null : int(body.y, 'y', 0, 255);
  const pk = body.pk === undefined ? null : int(body.pk, 'pk', 0, 1_000_000);
  const masterPoints = body.masterPoints === undefined ? null : int(body.masterPoints, 'masterPoints', 0, 1_000_000);
  const cols = await columnsOf(sql, 'Character');
  const extra: [string, number][] = [];
  const LIMITS: Record<string, [number, number]> = { status: [0, 32], heroState: [0, 6], heroSeconds: [0, 2147483647], fruitPoints: [0, 100000], negFruitPoints: [0, 100000], inventoryExtensions: [0, 4], masterExperience: [0, 9e15] };
  for (const [k, col] of Object.entries(OPTIONAL)) {
    if (body[k] === undefined) continue;
    if (!cols.has(col)) throw bad(`${k}: this OpenMU version has no such field.`);
    const [lo, hi] = LIMITS[k]!;
    extra.push([col, int(body[k], k, lo, hi)]);
  }
  if (body.status !== undefined && ![0, 1, 32].includes(body.status as number)) throw bad('status: 0 normal, 1 banned, 32 game master.');
  const newName = body.name === undefined ? null : String(body.name);
  if (newName !== null) {
    if (!/^[A-Za-z0-9_]{3,10}$/.test(newName)) throw bad('name: 3-10 letters, numbers or _.');
    if (newName.toLowerCase() !== name.toLowerCase() && (await sql`SELECT 1 FROM data."Character" WHERE lower("Name") = lower(${newName})`).length) throw bad('That name is taken.');
  }
  const classId = body.classId === undefined ? null : String(body.classId);
  let classIsLord = false;
  if (classId !== null) {
    const k = (await sql`SELECT split_part("Name", '||', 1) AS name FROM config."CharacterClass" WHERE "Id" = ${classId}::uuid`.catch(() => []))[0];
    if (!k) throw bad('classId: not a known class.');
    classIsLord = /Dark Lord|Lord Emperor/i.test(k.name as string);
  }
  const exp = body.experience === undefined ? null : int(body.experience, 'experience', 0, 9e15);
  const stats = Object.keys(STATS).filter(k => body[k] !== undefined).map(k => {
    if (c[k] === null) throw bad(`${name} has no ${k} (that class does not use it).`);
    return [k, int(body[k], k, 0, MAX_STAT)] as const;
  });
  const counters = Object.keys(COUNTERS).filter(k => body[k] !== undefined).map(k => [k, int(body[k], k, 0, k === 'masterLevel' ? 1000 : 1_000_000)] as const);
  return write(sql, { admin, action: 'character.edit', target: name, detail: { ...body } }, async w => {
    await w.save('Character', 'Id', [c.id as string]);
    await w.save('StatAttribute', 'Id', (await w.tx`SELECT "Id" FROM data."StatAttribute" WHERE "CharacterId" = ${c.id as string}`).map(r => r.Id));
    await w.save('ItemStorage', 'Id', [c.inventoryId as string]);
    if (classId !== null) await w.save('StatAttribute', 'CharacterId', [c.id as string]);
    const setStat = async (designation: string, value: number) => {
      const r = await w.tx`
        UPDATE data."StatAttribute" sa SET "Value" = ${value} FROM config."AttributeDefinition" d
        WHERE d."Id" = sa."DefinitionId" AND sa."CharacterId" = ${c.id as string} AND d."Designation" = ${designation}`;
      if (r.count !== 1) throw bad(`stat row missing: ${designation}`);
    };
    if (level !== null) {
      await setStat('Level', level);
      // The experience bar must match the level, or the next kill levels the character again.
      await w.tx`UPDATE data."Character" SET "Experience" = ${experienceFor(level)} WHERE "Id" = ${c.id as string}`;
      detail.experience = experienceFor(level);
    }
    for (const [k, v] of stats) await setStat(STATS[k as keyof typeof STATS], v);
    for (const [k, v] of counters) {
      const des = COUNTERS[k as keyof typeof COUNTERS];
      const r = await w.tx`UPDATE data."StatAttribute" sa SET "Value" = ${v} FROM config."AttributeDefinition" d WHERE d."Id" = sa."DefinitionId" AND sa."CharacterId" = ${c.id as string} AND d."Designation" = ${des}`;
      if (r.count === 0) {
        const n = await w.tx`INSERT INTO data."StatAttribute" ("Id","CharacterId","DefinitionId","Value") SELECT gen_random_uuid(), ${c.id as string}, d."Id", ${v} FROM config."AttributeDefinition" d WHERE d."Designation" = ${des} LIMIT 1 RETURNING "Id"`;
        if (!n.length) throw bad(`${k}: this OpenMU version has no such stat.`);
        w.created('StatAttribute', n as never);
      }
    }
    if (lup !== null) await w.tx`UPDATE data."Character" SET "LevelUpPoints" = ${lup} WHERE "Id" = ${c.id as string}`;
    if (mapId !== null) await w.tx`UPDATE data."Character" SET "CurrentMapId" = ${mapId} WHERE "Id" = ${c.id as string}`;
    if (x !== null) await w.tx`UPDATE data."Character" SET "PositionX" = ${x} WHERE "Id" = ${c.id as string}`;
    if (y !== null) await w.tx`UPDATE data."Character" SET "PositionY" = ${y} WHERE "Id" = ${c.id as string}`;
    if (pk !== null) await w.tx`UPDATE data."Character" SET "PlayerKillCount" = ${pk} WHERE "Id" = ${c.id as string}`;
    if (masterPoints !== null) await w.tx`UPDATE data."Character" SET "MasterLevelUpPoints" = ${masterPoints} WHERE "Id" = ${c.id as string}`;
    for (const [col, v] of extra) await w.tx.unsafe(`UPDATE data."Character" SET "${col}" = $1 WHERE "Id" = $2`, [v, c.id as string]);
    if (newName !== null) await w.tx`UPDATE data."Character" SET "Name" = ${newName} WHERE "Id" = ${c.id as string}`;
    if (exp !== null) await w.tx`UPDATE data."Character" SET "Experience" = ${exp} WHERE "Id" = ${c.id as string}`;
    if (classId !== null) {
      await w.tx`UPDATE data."Character" SET "CharacterClassId" = ${classId}::uuid WHERE "Id" = ${c.id as string}`;
      // Dark Lord and Lord Emperor use Command (leadership); give the stat row when it is missing.
      if (classIsLord) {
        const has = await w.tx`SELECT 1 FROM data."StatAttribute" sa JOIN config."AttributeDefinition" d ON d."Id" = sa."DefinitionId" WHERE sa."CharacterId" = ${c.id as string} AND d."Designation" = 'Base Leadership'`;
        if (!has.length) {
          const r = await w.tx`INSERT INTO data."StatAttribute" ("Id","CharacterId","DefinitionId","Value") SELECT gen_random_uuid(), ${c.id as string}, d."Id", 0 FROM config."AttributeDefinition" d WHERE d."Designation" = 'Base Leadership' LIMIT 1 RETURNING "Id"`;
          w.created('StatAttribute', r as never);
        }
      }
    }
    if (zen !== null) await w.tx`UPDATE data."ItemStorage" SET "Money" = ${zen} WHERE "Id" = ${c.inventoryId as string}`;
  });
}

export async function listClasses(sql: Sql) {
  return sql`SELECT "Id" AS id, split_part("Name", '||', 1) AS name FROM config."CharacterClass" ORDER BY 2`;
}

/** Deletes a character with its stats, skills, inventory and items. Refuses when anything this panel does not know still points at it. */
export async function deleteCharacter(sql: Sql, admin: string, name: string, confirm: unknown) {
  if (confirm !== name) throw bad('confirm: send the exact character name to delete it.');
  const c = await getCharacter(sql, name);
  const inv = c.inventoryId as string | null;
  const items = inv ? (await sql`SELECT "Id" FROM data."Item" WHERE "ItemStorageId" = ${inv}`).map(r => r.Id as string) : [];
  await refuseIfUsed(sql, 'Character', [c.id as string], ['StatAttribute.CharacterId', 'SkillEntry.CharacterId'], name);
  if (items.length) await refuseIfUsed(sql, 'Item', items, ['ItemOptionLink.ItemId', 'ItemItemOfItemSet.ItemId'], `An item of ${name}`);
  return write(sql, { admin, action: 'character.delete', target: name, detail: { items: items.length, account: c.account } }, async w => {
    const id = c.id as string;
    await w.save('Character', 'Id', [id]);
    await w.save('StatAttribute', 'CharacterId', [id]);
    await w.save('SkillEntry', 'CharacterId', [id]);
    if (inv) {
      await w.save('ItemStorage', 'Id', [inv]);
      await w.save('Item', 'ItemStorageId', [inv]);
      await w.save('ItemOptionLink', 'ItemId', items);
      await w.save('ItemItemOfItemSet', 'ItemId', items);
    }
    await w.tx`DELETE FROM data."ItemOptionLink" WHERE "ItemId" = ANY(${items}::uuid[])`;
    await w.tx`DELETE FROM data."ItemItemOfItemSet" WHERE "ItemId" = ANY(${items}::uuid[])`;
    await w.tx`DELETE FROM data."Item" WHERE "Id" = ANY(${items}::uuid[])`;
    await w.tx`DELETE FROM data."SkillEntry" WHERE "CharacterId" = ${id}`;
    await w.tx`DELETE FROM data."StatAttribute" WHERE "CharacterId" = ${id}`;
    await w.tx`DELETE FROM data."Character" WHERE "Id" = ${id}`;
    if (inv) await w.tx`DELETE FROM data."ItemStorage" WHERE "Id" = ${inv}`;
  });
}
