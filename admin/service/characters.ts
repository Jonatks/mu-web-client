// Characters: list, read, edit level / stats / zen. Level is a StatAttribute; zen is the money of the inventory storage.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { experienceFor } from './exp';
import { write } from './undo';

const STATS = { strength: 'Base Strength', agility: 'Base Agility', vitality: 'Base Vitality', energy: 'Base Energy', leadership: 'Base Leadership' } as const;
export const MAX_LEVEL = 400;
export const MAX_STAT = 32767;
export const MAX_ZEN = 2147483647;

const BASE = `
  SELECT c."Id" AS id, c."Name" AS name, a."LoginName" AS account, split_part(k."Name", '||', 1) AS class,
         split_part(m."Name", '||', 1) AS map, c."LevelUpPoints" AS "levelUpPoints", c."Experience" AS experience, s."Money" AS zen,
         c."InventoryId" AS "inventoryId", c."CharacterSlot" AS slot, c."CurrentMapId" AS "mapId",
         c."PositionX"::int AS x, c."PositionY"::int AS y, c."PlayerKillCount" AS pk, c."MasterLevelUpPoints" AS "masterPoints",
         COALESCE((SELECT sa."Value" FROM data."StatAttribute" sa JOIN config."AttributeDefinition" d ON d."Id" = sa."DefinitionId"
                   WHERE sa."CharacterId" = c."Id" AND d."Designation" = 'Level'), 0)::int AS level
  FROM data."Character" c
  JOIN data."Account" a ON a."Id" = c."AccountId"
  JOIN config."CharacterClass" k ON k."Id" = c."CharacterClassId"
  LEFT JOIN config."GameMapDefinition" m ON m."Id" = c."CurrentMapId"
  LEFT JOIN data."ItemStorage" s ON s."Id" = c."InventoryId"`;

export async function listCharacters(sql: Sql, q = '', account = '') {
  return sql.unsafe(`${BASE} WHERE c."Name" ILIKE $1 AND ($2 = '' OR a."LoginName" = $2) ORDER BY a."LoginName", c."CharacterSlot" LIMIT 200`, ['%' + q.replace(/[%_\\]/g, '') + '%', account]);
}

export async function listMaps(sql: Sql) {
  return sql`SELECT "Id" AS id, split_part("Name", '||', 1) AS name FROM config."GameMapDefinition" ORDER BY "Number"`;
}

export async function getCharacter(sql: Sql, name: string) {
  const r = await sql.unsafe(`${BASE} WHERE c."Name" = $1`, [name]);
  const c = r[0];
  if (!c) throw missing('No such character.');
  const stats = await sql`
    SELECT d."Designation" AS d, sa."Value"::int AS v FROM data."StatAttribute" sa JOIN config."AttributeDefinition" d ON d."Id" = sa."DefinitionId"
    WHERE sa."CharacterId" = ${c.id as string} AND d."Designation" IN ${sql(Object.values(STATS))}`;
  const by = new Map(stats.map(s => [s.d as string, s.v as number]));
  const out: Record<string, number | null> = {};
  for (const [k, des] of Object.entries(STATS)) out[k] = by.get(des) ?? null;
  return { ...c, ...out };
}

const int = (v: unknown, name: string, min: number, max: number): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw bad(`${name}: a whole number from ${min} to ${max}.`);
  return v;
};

/** Edits only the fields sent. The caller has already checked that nobody is connected. */
export async function patchCharacter(sql: Sql, admin: string, name: string, body: Record<string, unknown>) {
  const c = await getCharacter(sql, name);
  const known = ['level', 'zen', 'levelUpPoints', 'mapId', 'x', 'y', 'pk', 'masterPoints', ...Object.keys(STATS)];
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
  const stats = Object.keys(STATS).filter(k => body[k] !== undefined).map(k => {
    if (c[k] === null) throw bad(`${name} has no ${k} (that class does not use it).`);
    return [k, int(body[k], k, 0, MAX_STAT)] as const;
  });
  return write(sql, { admin, action: 'character.edit', target: name, detail: { ...body } }, async w => {
    await w.save('Character', 'Id', [c.id as string]);
    await w.save('StatAttribute', 'Id', (await w.tx`SELECT "Id" FROM data."StatAttribute" WHERE "CharacterId" = ${c.id as string}`).map(r => r.Id));
    await w.save('ItemStorage', 'Id', [c.inventoryId as string]);
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
    if (lup !== null) await w.tx`UPDATE data."Character" SET "LevelUpPoints" = ${lup} WHERE "Id" = ${c.id as string}`;
    if (mapId !== null) await w.tx`UPDATE data."Character" SET "CurrentMapId" = ${mapId} WHERE "Id" = ${c.id as string}`;
    if (x !== null) await w.tx`UPDATE data."Character" SET "PositionX" = ${x} WHERE "Id" = ${c.id as string}`;
    if (y !== null) await w.tx`UPDATE data."Character" SET "PositionY" = ${y} WHERE "Id" = ${c.id as string}`;
    if (pk !== null) await w.tx`UPDATE data."Character" SET "PlayerKillCount" = ${pk} WHERE "Id" = ${c.id as string}`;
    if (masterPoints !== null) await w.tx`UPDATE data."Character" SET "MasterLevelUpPoints" = ${masterPoints} WHERE "Id" = ${c.id as string}`;
    if (zen !== null) await w.tx`UPDATE data."ItemStorage" SET "Money" = ${zen} WHERE "Id" = ${c.inventoryId as string}`;
  });
}
