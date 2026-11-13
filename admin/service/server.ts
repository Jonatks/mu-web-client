// The server's own settings: experience and rules, drops, spawn spots, monsters, NPC shops, events, warps and plugin settings.
// They live in the game configuration. OpenMU reads it when it starts, so a change applies after a restart (`restartServer`).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { type Writer, write } from './undo';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuid = (v: unknown, what: string): string => {
  if (typeof v !== 'string' || !UUID.test(v)) throw bad(`${what}: not a valid id.`);
  return v.toLowerCase();
};
const num = (v: unknown, name: string, min: number, max: number, whole = true): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || (whole && !Number.isInteger(v)) || v < min || v > max) throw bad(`${name}: ${whole ? 'a whole number' : 'a number'} from ${min} to ${max}.`);
  return v;
};
const bool = (v: unknown, name: string): boolean => {
  if (typeof v !== 'boolean') throw bad(`${name}: true or false.`);
  return v;
};
const NAME = (col: string) => `split_part(${col}, '||', 1)`;

/** Updates the given columns of one config row, saving the row first so it can be undone. */
async function patch(w: Writer, table: string, id: string, cols: [string, unknown, string?][]) {
  if (cols.length === 0) return;
  await w.save(`config.${table}`, 'Id', [id]);
  const sets = cols.map(([c, , expr], i) => `"${c}" = ${expr ? expr.replace('$$', `$${i + 2}`) : `$${i + 2}`}`).join(', ');
  const hit = await w.tx.unsafe(`UPDATE config."${table}" SET ${sets} WHERE "Id" = $1`, [id, ...cols.map(c => c[1] as never)]);
  if (hit.count === 0) throw missing(`No such ${table}.`);
}

/* ------------------------------------------------------------------ rules */

type Field = { key: string; label: string; help: string; kind: 'float' | 'int' | 'bool' | 'seconds'; min?: number; max?: number };
export const RULE_FIELDS: Field[] = [
  { key: 'ExperienceRate', label: 'Experiencia', help: 'Multiplica la experiencia de todo el servidor. 1 es normal, 99 es «exp 99x».', kind: 'float', min: 0, max: 100000 },
  { key: 'MasterExperienceRate', label: 'Experiencia Master', help: 'Lo mismo, para la experiencia de nivel Master.', kind: 'float', min: 0, max: 100000 },
  { key: 'MaximumLevel', label: 'Nivel máximo', help: 'Hasta qué nivel se puede subir.', kind: 'int', min: 1, max: 32767 },
  { key: 'MaximumMasterLevel', label: 'Nivel Master máximo', help: 'Hasta qué nivel Master se puede subir.', kind: 'int', min: 0, max: 32767 },
  { key: 'MaximumCharactersPerAccount', label: 'Personajes por cuenta', help: 'Cuántos personajes puede crear cada cuenta.', kind: 'int', min: 1, max: 8 },
  { key: 'MaximumPartySize', label: 'Tamaño máximo del grupo', help: 'Cuántos jugadores caben en un grupo (party).', kind: 'int', min: 2, max: 10 },
  { key: 'MaximumInventoryMoney', label: 'Zen máximo en el inventario', help: 'Tope de zen que puede llevar un personaje.', kind: 'int', min: 0, max: 2147483647 },
  { key: 'MaximumVaultMoney', label: 'Zen máximo en el baúl', help: 'Tope de zen que cabe en el baúl.', kind: 'int', min: 0, max: 2147483647 },
  { key: 'ShouldDropMoney', label: 'Los monstruos sueltan zen', help: 'Si está apagado, los monstruos no sueltan zen.', kind: 'bool' },
  { key: 'ItemDropDuration', label: 'Tiempo que dura un ítem en el suelo', help: 'En segundos. Pasado ese tiempo el ítem desaparece.', kind: 'seconds', min: 1, max: 86400 },
  { key: 'MaximumItemOptionLevelDrop', label: 'Opción adicional máxima en drops', help: 'Nivel más alto de la opción adicional (+4 por nivel) que puede traer un ítem caído.', kind: 'int', min: 0, max: 4 },
  { key: 'ExcellentItemDropLevelDelta', label: 'Diferencia de nivel para excelentes', help: 'Cuántos niveles por debajo del monstruo se consideran para ítems excelentes.', kind: 'int', min: 0, max: 255 },
  { key: 'LetterSendPrice', label: 'Precio de enviar una carta', help: 'Zen que cuesta mandar una carta.', kind: 'int', min: 0, max: 2147483647 },
  { key: 'MaximumLetters', label: 'Cartas máximas por buzón', help: 'Cuántas cartas puede tener cada personaje.', kind: 'int', min: 1, max: 1000 },
  { key: 'RecoveryInterval', label: 'Cada cuánto se recupera vida y maná', help: 'En milisegundos. Más bajo, recupera más rápido.', kind: 'int', min: 100, max: 600000 },
  { key: 'InfoRange', label: 'Rango de visión', help: 'A cuántas casillas se ven los demás jugadores y monstruos.', kind: 'int', min: 1, max: 30 },
  { key: 'PreventExperienceOverflow', label: 'Evitar que la experiencia se pase del nivel', help: 'Si está activo, no se puede subir dos niveles de un solo golpe de experiencia.', kind: 'bool' },
];

const selectRule = (f: Field) => (f.kind === 'seconds' ? `EXTRACT(EPOCH FROM "${f.key}")::float8 AS "${f.key}"` : `"${f.key}" AS "${f.key}"`);

export async function getRules(sql: Sql) {
  const cfg = (await sql.unsafe(`SELECT "Id" AS id, ${RULE_FIELDS.map(selectRule).join(', ')} FROM config."GameConfiguration" LIMIT 1`))[0];
  if (!cfg) throw missing('The game configuration is missing.');
  const servers = await sql.unsafe(
    `SELECT d."Id" AS id, d."ServerID" AS "serverId", d."Description" AS description, d."ExperienceRate" AS "experienceRate", d."PvpEnabled" AS "pvpEnabled",
            c."Id" AS "configId", c."MaximumPlayers" AS "maximumPlayers"
     FROM config."GameServerDefinition" d LEFT JOIN config."GameServerConfiguration" c ON c."Id" = d."ServerConfigurationId" ORDER BY d."ServerID"`
  );
  const { id, ...values } = cfg;
  return { id, fields: RULE_FIELDS, values, servers };
}

type ServerPatch = { id: string; description?: string; experienceRate?: number; pvpEnabled?: boolean; maximumPlayers?: number };
export async function setRules(sql: Sql, admin: string, b: { values?: Record<string, unknown>; servers?: ServerPatch[] }) {
  const cur = await getRules(sql);
  const cols: [string, unknown, string?][] = [];
  for (const [key, v] of Object.entries(b.values ?? {})) {
    const f = RULE_FIELDS.find(x => x.key === key);
    if (!f) throw bad(`Unknown setting: ${key}.`);
    if (f.kind === 'bool') cols.push([key, bool(v, f.label)]);
    else if (f.kind === 'seconds') cols.push([key, num(v, f.label, f.min!, f.max!, false), 'make_interval(secs => $$::float8)']);
    else cols.push([key, num(v, f.label, f.min!, f.max!, f.kind === 'int')]);
  }
  const servers = b.servers ?? [];
  for (const s of servers) {
    uuid(s.id, 'server');
    if (!cur.servers.some(x => x.id === s.id)) throw missing('No such server.');
  }
  if (cols.length === 0 && servers.length === 0) throw bad('Nothing to change.');
  return write(sql, { admin, action: 'server.rules', target: 'game configuration', detail: { keys: cols.map(c => c[0]), servers: servers.length } }, async w => {
    await patch(w, 'GameConfiguration', cur.id as string, cols);
    for (const s of servers) {
      const sc: [string, unknown, string?][] = [];
      if (s.description !== undefined) { if (typeof s.description !== 'string' || s.description.length > 100) throw bad('description: up to 100 characters.'); sc.push(['Description', s.description]); }
      if (s.experienceRate !== undefined) sc.push(['ExperienceRate', num(s.experienceRate, 'experienceRate', 0, 100000, false)]);
      if (s.pvpEnabled !== undefined) sc.push(['PvpEnabled', bool(s.pvpEnabled, 'pvpEnabled')]);
      await patch(w, 'GameServerDefinition', s.id, sc);
      if (s.maximumPlayers !== undefined) {
        const cid = cur.servers.find(x => x.id === s.id)?.configId as string | null;
        if (!cid) throw bad('That server has no player limit setting.');
        await patch(w, 'GameServerConfiguration', cid, [['MaximumPlayers', num(s.maximumPlayers, 'maximumPlayers', 1, 5000)]]);
      }
    }
    return { ok: true };
  });
}

/* ------------------------------------------------------------------- maps */

export const listMaps = (sql: Sql) =>
  sql.unsafe(`SELECT "Id" AS id, "Number" AS number, ${NAME('"Name"')} AS name, "ExpMultiplier"::float8 AS "expMultiplier",
              (SELECT count(*)::int FROM config."MonsterSpawnArea" s WHERE s."GameMapId" = m."Id") AS spawns,
              (SELECT coalesce(sum(s."Quantity"), 0)::int FROM config."MonsterSpawnArea" s WHERE s."GameMapId" = m."Id") AS monsters FROM config."GameMapDefinition" m ORDER BY "Number"`);

type LogLine = { id?: unknown; action?: unknown; at?: unknown; detail?: unknown };

/** Saved server changes the running game has not loaded yet. A change that was undone, with its undo line, counts as nothing. */
export function pendingChanges(log: LogLine[]): { pending: number; lastRestart: string | null } {
  let lastRestart: string | null = null;
  const since: LogLine[] = [];
  for (const e of log) {
    if (String(e.action ?? '') === 'server.restart') { lastRestart = String(e.at ?? ''); break; }
    if (/^(undo:)?server\./.test(String(e.action ?? ''))) since.push(e);
  }
  const ids = new Set(since.map(e => String(e.id ?? '')));
  const undone = new Set(since.map(e => (e.detail as { undoes?: string } | null)?.undoes).filter(Boolean));
  const pending = since.filter(e => (String(e.action).startsWith('undo:') ? !ids.has(String((e.detail as { undoes?: string } | null)?.undoes)) : !undone.has(String(e.id)))).length;
  return { pending, lastRestart };
}

/** The numbers at the top of the page, and how many saved changes still wait for a restart (read from the log, newest first). */
export async function overview(sql: Sql, log: LogLine[]) {
  const rules = await getRules(sql);
  const spots = (await sql`SELECT count(*)::int AS n, coalesce(sum("Quantity"), 0)::int AS q FROM config."MonsterSpawnArea"`)[0]!;
  const drops = (await sql`SELECT count(*)::int AS n, count(*) FILTER (WHERE "Chance" >= 1)::int AS always, coalesce(avg("Chance") FILTER (WHERE "ItemType" = 3), 0)::float8 AS avg FROM config."DropItemGroup"`)[0]!;
  const plug = (await sql`SELECT count(*) FILTER (WHERE "IsActive")::int AS active, count(*)::int AS total FROM config."PlugInConfiguration" WHERE "CustomConfiguration" IS NOT NULL`)[0]!;
  const { pending, lastRestart } = pendingChanges(log);
  return { rules: rules.values, servers: rules.servers, spots: { count: spots.n, monsters: spots.q }, drops: { groups: drops.n, always: drops.always, avgRandom: drops.avg }, plugins: { active: plug.active, total: plug.total }, pending, lastRestart };
}

export async function setMap(sql: Sql, admin: string, id: string, b: { expMultiplier?: unknown }) {
  uuid(id, 'map');
  if (b.expMultiplier === undefined) throw bad('Nothing to change.');
  const v = num(b.expMultiplier, 'expMultiplier', 0, 100000, false);
  return write(sql, { admin, action: 'server.map', target: id, detail: { expMultiplier: v } }, async w => { await patch(w, 'GameMapDefinition', id, [['ExpMultiplier', v]]); return { ok: true }; });
}

/** The terrain of a map as one byte per tile (x + y * 256): 0 and 1 walkable (1 is a safe zone), anything else blocked. */
export async function terrain(sql: Sql, id: string) {
  uuid(id, 'map');
  const r = (await sql`SELECT substring("TerrainData" from 4 for 65536) AS t FROM config."GameMapDefinition" WHERE "Id" = ${id}::uuid`)[0];
  if (!r) throw missing('No such map.');
  const t = r.t as Uint8Array | null;
  return { size: 256, data: t && t.length === 65536 ? Buffer.from(t).toString('base64') : null };
}

async function walkable(sql: Sql, mapId: string, x1: number, y1: number, x2: number, y2: number): Promise<number> {
  const t = await terrain(sql, mapId);
  if (!t.data) return (x2 - x1 + 1) * (y2 - y1 + 1);
  const bytes = Buffer.from(t.data, 'base64');
  let n = 0;
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (bytes[x + y * 256] === 0) n++;
  return n;
}

/* ------------------------------------------------------------------ drops */

const DROP_TYPES = ['Ninguno', 'Ancient', 'Excelente', 'Ítem al azar', 'Con socket', 'Zen', 'Jewel'];

export async function listDrops(sql: Sql) {
  const rows = await sql.unsafe(
    `SELECT g."Id" AS id, ${NAME('g."Description"')} AS description, g."Chance"::float8 AS chance, g."MinimumMonsterLevel" AS "minLevel", g."MaximumMonsterLevel" AS "maxLevel",
            g."ItemLevel" AS "itemLevel", g."ItemType" AS "itemType", g."MonsterId" AS "monsterId",
            (SELECT count(*)::int FROM config."DropItemGroupItemDefinition" j WHERE j."DropItemGroupId" = g."Id") AS possible,
            ARRAY(SELECT ${NAME('m."Name"')} FROM config."GameMapDefinitionDropItemGroup" j JOIN config."GameMapDefinition" m ON m."Id" = j."GameMapDefinitionId" WHERE j."DropItemGroupId" = g."Id" ORDER BY m."Number") AS maps,
            (SELECT count(*)::int FROM config."MonsterDefinitionDropItemGroup" j WHERE j."DropItemGroupId" = g."Id") AS monsters
     FROM config."DropItemGroup" g ORDER BY g."ItemType", g."Chance" DESC, 2`
  );
  return rows.map(r => ({ ...r, typeName: DROP_TYPES[r.itemType as number] ?? String(r.itemType) }));
}

type DropPatch = { chance?: unknown; minLevel?: unknown; maxLevel?: unknown; itemLevel?: unknown };
export async function setDrop(sql: Sql, admin: string, id: string, b: DropPatch) {
  uuid(id, 'drop group');
  const cols: [string, unknown][] = [];
  if (b.chance !== undefined) cols.push(['Chance', num(b.chance, 'chance', 0, 1, false)]);
  if (b.minLevel !== undefined) cols.push(['MinimumMonsterLevel', b.minLevel === null ? null : num(b.minLevel, 'minLevel', 0, 255)]);
  if (b.maxLevel !== undefined) cols.push(['MaximumMonsterLevel', b.maxLevel === null ? null : num(b.maxLevel, 'maxLevel', 0, 255)]);
  if (b.itemLevel !== undefined) cols.push(['ItemLevel', b.itemLevel === null ? null : num(b.itemLevel, 'itemLevel', 0, 15)]);
  if (cols.length === 0) throw bad('Nothing to change.');
  return write(sql, { admin, action: 'server.drop', target: id, detail: Object.fromEntries(cols) }, async w => { await patch(w, 'DropItemGroup', id, cols); return { ok: true }; });
}

/** Multiplies the chance of every group of the given types by `factor` (never above 1, which means "always"). */
export async function scaleDrops(sql: Sql, admin: string, b: { factor?: unknown; types?: unknown; dryRun?: unknown }) {
  const factor = num(b.factor, 'factor', 0.01, 1000, false);
  const types = Array.isArray(b.types) ? b.types.map(t => num(t, 'type', 0, 6)) : [];
  if (types.length === 0) throw bad('types: choose at least one kind of drop.');
  const rows = (await sql.unsafe(`SELECT "Id" AS id, "Chance"::float8 AS chance FROM config."DropItemGroup" WHERE "ItemType" = ANY($1::int[]) AND "Chance" < 1`, [types as never])) as unknown as { id: string; chance: number }[];
  const next = rows.map(r => ({ id: r.id, from: r.chance, to: Math.min(1, r.chance * factor) }));
  const always = next.filter(n => n.to >= 1).length;
  if (b.dryRun) return { groups: next.length, always, sample: next.slice(0, 5) };
  if (next.length === 0) return { groups: 0, always: 0 };
  return write(sql, { admin, action: 'server.drops.scale', target: 'drop groups', detail: { factor, types, groups: next.length } }, async w => {
    await w.save('config.DropItemGroup', 'Id', next.map(n => n.id));
    await w.tx.unsafe(`UPDATE config."DropItemGroup" SET "Chance" = LEAST(1, "Chance" * $1::float8) WHERE "Id" = ANY($2::uuid[])`, [factor, next.map(n => n.id) as never]);
    return { groups: next.length, always };
  });
}

/* -------------------------------------------------- boxes and objects (Kundun and the rest) */

/** The drops of an item that opens (Box of Kundun +1..+5, Box of Luck...): each box level has an item group and, usually, a zen group that catches the rest. */
export type BoxGroup = { id: string; key: string; name: string; description: string; chance: number; money: number };

const BOX_FROM = `FROM config."ItemDropItemGroup" g JOIN config."ItemDefinition" d ON d."Id" = g."ItemDefinitionId"`;
const boxGroups = async (sql: Sql): Promise<BoxGroup[]> =>
  (await sql.unsafe(
    `SELECT g."Id" AS id, d."Id"::text || ':' || g."SourceItemLevel"::text AS key, ${NAME('d."Name"')} AS name, ${NAME('g."Description"')} AS description,
            g."Chance"::float8 AS chance, g."MoneyAmount" AS money ${BOX_FROM} ORDER BY d."Group", d."Number", g."SourceItemLevel", g."Chance"`
  ).catch(() => {
    throw bad('This server has no drops for boxes.');
  })) as unknown as BoxGroup[];

/** One row per box level: the chance of getting items (the rest is zen), and whether it can be changed (it needs both kinds of group). */
export function boxSummary(groups: BoxGroup[]) {
  const by = new Map<string, BoxGroup[]>();
  for (const g of groups) by.set(g.key, [...(by.get(g.key) ?? []), g]);
  return [...by].map(([key, gs]) => {
    const items = gs.filter(g => g.money === 0);
    const zen = gs.find(g => g.money > 0);
    const description = items[0]?.description || gs[0]!.name;
    return {
      key, name: gs[0]!.name, description, zen: zen?.money ?? 0,
      itemChance: Math.min(1, items.reduce((a, g) => a + g.chance, 0)),
      adjustable: items.length > 0 && !!zen,
      kundun: /kundun/i.test(`${description} ${gs[0]!.name}`),
    };
  });
}

/** The new chances so the item groups of one box add up to `chance` (their proportions stay). */
export function boxPlan(groups: BoxGroup[], chance: number) {
  const items = groups.filter(g => g.money === 0);
  const total = items.reduce((a, g) => a + g.chance, 0);
  if (items.length === 0 || !groups.some(g => g.money > 0)) throw bad('That box has no zen group to give the rest to.');
  if (total <= 0) throw bad('That box has an item group with chance 0; set it with the drops list first.');
  return items.map(g => ({ id: g.id, from: g.chance, to: Math.min(0.99, (g.chance * chance) / total) }));
}

export async function listBoxes(sql: Sql) {
  return boxSummary(await boxGroups(sql));
}

/** Sets how often the chosen boxes give items instead of zen. 0.99 is the most: at 1 the zen group would tie with the items. */
export async function setBoxItemChance(sql: Sql, admin: string, b: { chance?: unknown; keys?: unknown }) {
  const chance = num(b.chance, 'chance', 0.01, 0.99, false);
  const keys = Array.isArray(b.keys) ? b.keys.map(k => String(k)) : [];
  if (keys.length === 0) throw bad('keys: choose at least one box.');
  const all = await boxGroups(sql);
  const plans = keys.flatMap(k => {
    const gs = all.filter(g => g.key === k);
    if (gs.length === 0) throw missing('No such box.');
    return boxPlan(gs, chance);
  });
  return write(sql, { admin, action: 'server.boxes', target: 'box drops', detail: { chance, boxes: keys.length } }, async w => {
    await w.save('config.ItemDropItemGroup', 'Id', plans.map(p => p.id));
    for (const p of plans) await w.tx.unsafe(`UPDATE config."ItemDropItemGroup" SET "Chance" = $1::float8 WHERE "Id" = $2::uuid`, [p.to, p.id]);
    return { boxes: keys.length, groups: plans.length };
  });
}

/* --------------------------------------------------------------- monsters */

const KINDS = ['Monstruo', 'NPC', 'Guardia', 'Trampa', 'Puerta', 'Estatua', 'Pelota', 'Destruible'];

export async function listMonsters(sql: Sql, q = '', kind = '') {
  const clean = q.replace(/[%_\\]/g, '');
  const k = kind === '' ? -1 : Number(kind);
  const rows = await sql.unsafe(
    `SELECT d."Id" AS id, d."Number" AS number, ${NAME('d."Designation"')} AS name, d."ObjectKind" AS kind,
            EXTRACT(EPOCH FROM d."RespawnDelay")::float8 AS "respawnSeconds", d."NumberOfMaximumItemDrops" AS "maxDrops", d."MerchantStoreId" IS NOT NULL AS "hasShop",
            (SELECT count(*)::int FROM config."MonsterSpawnArea" s WHERE s."MonsterDefinitionId" = d."Id") AS spawns,
            (SELECT a."Value"::float8 FROM config."MonsterAttribute" a JOIN config."AttributeDefinition" ad ON ad."Id" = a."AttributeDefinitionId" WHERE a."MonsterDefinitionId" = d."Id" AND ${NAME('ad."Designation"')} = 'Level' LIMIT 1) AS level
     FROM config."MonsterDefinition" d WHERE ${NAME('d."Designation"')} ILIKE $1 AND ($2 = -1 OR d."ObjectKind" = $2) ORDER BY d."Number" LIMIT 200`,
    ['%' + clean + '%', Number.isInteger(k) ? k : -1]
  );
  return rows.map(r => ({ ...r, kindName: KINDS[r.kind as number] ?? String(r.kind) }));
}

export async function getMonster(sql: Sql, id: string) {
  uuid(id, 'monster');
  const m = await listMonsterOne(sql, id);
  if (!m) throw missing('No such monster.');
  const attrs = [...(await sql.unsafe(
    `SELECT a."Id" AS id, ${NAME('ad."Designation"')} AS name, a."Value"::float8 AS value FROM config."MonsterAttribute" a
     JOIN config."AttributeDefinition" ad ON ad."Id" = a."AttributeDefinitionId" WHERE a."MonsterDefinitionId" = $1 ORDER BY 2`,
    [id]
  ))] as unknown as { id: string; name: string; value: number }[];
  return { ...m, attributes: attrs };
}
type MonsterRow = Record<string, unknown> & { name: string; number: number; kindName: string };
async function listMonsterOne(sql: Sql, id: string): Promise<MonsterRow | null> {
  const r = await sql.unsafe(
    `SELECT d."Id" AS id, d."Number" AS number, ${NAME('d."Designation"')} AS name, d."ObjectKind" AS kind, EXTRACT(EPOCH FROM d."RespawnDelay")::float8 AS "respawnSeconds",
            d."NumberOfMaximumItemDrops" AS "maxDrops", d."MoveRange" AS "moveRange", d."AttackRange" AS "attackRange", d."ViewRange" AS "viewRange",
            EXTRACT(EPOCH FROM d."MoveDelay")::float8 AS "moveSeconds", EXTRACT(EPOCH FROM d."AttackDelay")::float8 AS "attackSeconds"
     FROM config."MonsterDefinition" d WHERE d."Id" = $1`,
    [id]
  );
  return r[0] ? ({ ...r[0], kindName: KINDS[r[0].kind as number] ?? String(r[0].kind) } as unknown as MonsterRow) : null;
}

type MonsterPatch = { respawnSeconds?: unknown; maxDrops?: unknown; moveRange?: unknown; attackRange?: unknown; viewRange?: unknown; moveSeconds?: unknown; attackSeconds?: unknown; attributes?: Record<string, unknown> };
export async function setMonster(sql: Sql, admin: string, id: string, b: MonsterPatch) {
  const cur = await getMonster(sql, id);
  const cols: [string, unknown, string?][] = [];
  const secs = (key: string, col: string, max: number) => { if (b[key as 'respawnSeconds'] !== undefined) cols.push([col, num(b[key as 'respawnSeconds'], key, 0, max, false), 'make_interval(secs => $$::float8)']); };
  secs('respawnSeconds', 'RespawnDelay', 86400); secs('moveSeconds', 'MoveDelay', 3600); secs('attackSeconds', 'AttackDelay', 3600);
  if (b.maxDrops !== undefined) cols.push(['NumberOfMaximumItemDrops', num(b.maxDrops, 'maxDrops', 0, 20)]);
  if (b.moveRange !== undefined) cols.push(['MoveRange', num(b.moveRange, 'moveRange', 0, 50)]);
  if (b.attackRange !== undefined) cols.push(['AttackRange', num(b.attackRange, 'attackRange', 0, 50)]);
  if (b.viewRange !== undefined) cols.push(['ViewRange', num(b.viewRange, 'viewRange', 0, 50)]);
  const attrs = Object.entries(b.attributes ?? {}).map(([aid, v]) => {
    uuid(aid, 'attribute');
    if (!cur.attributes.some(a => a.id === aid)) throw bad('That attribute does not belong to this monster.');
    return [aid, num(v, 'attribute value', -1e9, 1e9, false)] as const;
  });
  if (cols.length === 0 && attrs.length === 0) throw bad('Nothing to change.');
  return write(sql, { admin, action: 'server.monster', target: `${cur.name} (${cur.number})`, detail: { changed: cols.map(c => c[0]), attributes: attrs.length } }, async w => {
    await patch(w, 'MonsterDefinition', id, cols);
    for (const [aid, v] of attrs) await patch(w, 'MonsterAttribute', aid, [['Value', v]]);
    return { ok: true };
  });
}

/* ----------------------------------------------------------------- spawns */

const DIRECTIONS = ['Cualquiera', 'Oeste', 'Suroeste', 'Sur', 'Sureste', 'Este', 'Noreste', 'Norte', 'Noroeste'];
const TRIGGERS = ['Siempre', 'Durante un evento', 'Una vez al empezar el evento', 'Durante una oleada', 'Una vez al empezar la oleada', 'A mano (evento)', 'Vagando'];

export async function listSpawns(sql: Sql, map = '', monster = '') {
  if (map) uuid(map, 'map');
  const clean = monster.replace(/[%_\\]/g, '');
  const rows = await sql.unsafe(
    `SELECT s."Id" AS id, s."GameMapId" AS "mapId", m."Number" AS "mapNumber", ${NAME('m."Name"')} AS map, s."MonsterDefinitionId" AS "monsterId", d."Number" AS "monsterNumber",
            ${NAME('d."Designation"')} AS monster, d."ObjectKind" AS kind, s."X1" AS x1, s."Y1" AS y1, s."X2" AS x2, s."Y2" AS y2, s."Quantity" AS quantity,
            s."Direction" AS direction, s."SpawnTrigger" AS trigger, s."WaveNumber" AS wave
     FROM config."MonsterSpawnArea" s JOIN config."GameMapDefinition" m ON m."Id" = s."GameMapId" JOIN config."MonsterDefinition" d ON d."Id" = s."MonsterDefinitionId"
     WHERE ($1 = '' OR s."GameMapId" = $1::uuid) AND ${NAME('d."Designation"')} ILIKE $2 ORDER BY m."Number", d."Number", s."X1", s."Y1" LIMIT 400`,
    [map, '%' + clean + '%']
  );
  return rows.map(r => ({ ...r, directionName: DIRECTIONS[r.direction as number] ?? String(r.direction), triggerName: TRIGGERS[r.trigger as number] ?? String(r.trigger) }));
}

type SpawnBody = { mapId?: unknown; monsterId?: unknown; x1?: unknown; y1?: unknown; x2?: unknown; y2?: unknown; quantity?: unknown; direction?: unknown };
function rect(b: SpawnBody, cur?: { x1: number; y1: number; x2: number; y2: number }) {
  const r = { x1: num(b.x1 ?? cur?.x1, 'x1', 0, 255), y1: num(b.y1 ?? cur?.y1, 'y1', 0, 255), x2: num(b.x2 ?? cur?.x2, 'x2', 0, 255), y2: num(b.y2 ?? cur?.y2, 'y2', 0, 255) };
  if (r.x1 > r.x2 || r.y1 > r.y2) throw bad('The first corner must be above and to the left of the second one.');
  return r;
}

export async function addSpawn(sql: Sql, admin: string, b: SpawnBody) {
  const mapId = uuid(b.mapId, 'map'), monsterId = uuid(b.monsterId, 'monster');
  const r = rect(b);
  const quantity = num(b.quantity ?? 1, 'quantity', 1, 300);
  const direction = num(b.direction ?? 0, 'direction', 0, 8);
  const mon = (await sql`SELECT "Number" AS number, ${sql.unsafe(NAME('"Designation"'))} AS name FROM config."MonsterDefinition" WHERE "Id" = ${monsterId}::uuid`)[0];
  const map = (await sql`SELECT ${sql.unsafe(NAME('"Name"'))} AS name FROM config."GameMapDefinition" WHERE "Id" = ${mapId}::uuid`)[0];
  if (!mon || !map) throw missing('No such map or monster.');
  const free = await walkable(sql, mapId, r.x1, r.y1, r.x2, r.y2);
  if (free === 0) throw bad('Ese rectángulo no tiene ninguna casilla por donde se pueda caminar (o es zona segura). Elige otro lugar del mapa.');
  return write(sql, { admin, action: 'server.spawn.add', target: `${mon.name} en ${map.name}`, detail: { ...r, quantity } }, async w => {
    const row = await w.tx.unsafe(
      `INSERT INTO config."MonsterSpawnArea" ("Id","MonsterDefinitionId","GameMapId","X1","Y1","X2","Y2","Direction","Quantity","SpawnTrigger","WaveNumber")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 0, 0) RETURNING "Id"`,
      [monsterId, mapId, r.x1, r.y1, r.x2, r.y2, direction, quantity]
    );
    const id = row[0]!.Id as string;
    w.created('config.MonsterSpawnArea', [{ Id: id }]);
    return { id, walkable: free };
  });
}

export async function editSpawn(sql: Sql, admin: string, id: string, b: SpawnBody) {
  uuid(id, 'spawn');
  const cur = (await listSpawnOne(sql, id));
  if (!cur) throw missing('No such spawn.');
  const cols: [string, unknown][] = [];
  if (['x1', 'y1', 'x2', 'y2'].some(k => (b as Record<string, unknown>)[k] !== undefined)) {
    const r = rect(b, cur as never);
    if ((await walkable(sql, cur.mapId as string, r.x1, r.y1, r.x2, r.y2)) === 0) throw bad('Ese rectángulo no tiene ninguna casilla por donde se pueda caminar.');
    cols.push(['X1', r.x1], ['Y1', r.y1], ['X2', r.x2], ['Y2', r.y2]);
  }
  if (b.quantity !== undefined) cols.push(['Quantity', num(b.quantity, 'quantity', 1, 300)]);
  if (b.direction !== undefined) cols.push(['Direction', num(b.direction, 'direction', 0, 8)]);
  if (cols.length === 0) throw bad('Nothing to change.');
  return write(sql, { admin, action: 'server.spawn.edit', target: `${cur.monster} en ${cur.map}`, detail: Object.fromEntries(cols) }, async w => { await patch(w, 'MonsterSpawnArea', id, cols); return { ok: true }; });
}
async function listSpawnOne(sql: Sql, id: string) {
  const r = await sql.unsafe(
    `SELECT s."GameMapId" AS "mapId", ${NAME('m."Name"')} AS map, ${NAME('d."Designation"')} AS monster, s."X1" AS x1, s."Y1" AS y1, s."X2" AS x2, s."Y2" AS y2
     FROM config."MonsterSpawnArea" s JOIN config."GameMapDefinition" m ON m."Id" = s."GameMapId" JOIN config."MonsterDefinition" d ON d."Id" = s."MonsterDefinitionId" WHERE s."Id" = $1`,
    [id]
  );
  return r[0];
}

export async function deleteSpawn(sql: Sql, admin: string, id: string) {
  uuid(id, 'spawn');
  const cur = await listSpawnOne(sql, id);
  if (!cur) throw missing('No such spawn.');
  return write(sql, { admin, action: 'server.spawn.delete', target: `${cur.monster} en ${cur.map}` }, async w => {
    await w.save('config.MonsterSpawnArea', 'Id', [id]);
    await w.tx.unsafe(`DELETE FROM config."MonsterSpawnArea" WHERE "Id" = $1`, [id]);
    return { ok: true };
  });
}

/* ----------------------------------------------------------------- shops */

/** NPCs that have a shop, and how many items it sells. */
export const listShops = (sql: Sql) =>
  sql.unsafe(
    `SELECT d."Id" AS id, d."Number" AS number, ${NAME('d."Designation"')} AS name, d."MerchantStoreId" AS "storeId",
            (SELECT count(*)::int FROM data."Item" i WHERE i."ItemStorageId" = d."MerchantStoreId") AS items,
            ARRAY(SELECT DISTINCT ${NAME('m."Name"')} FROM config."MonsterSpawnArea" s JOIN config."GameMapDefinition" m ON m."Id" = s."GameMapId" WHERE s."MonsterDefinitionId" = d."Id") AS maps
     FROM config."MonsterDefinition" d WHERE d."MerchantStoreId" IS NOT NULL ORDER BY d."Number"`
  );

/* ----------------------------------------------------------------- events */

const GAMES: Record<number, string> = { 20: 'Devil Square', 25: 'Blood Castle', 30: 'Chaos Castle', 35: 'Illusion Temple', 40: 'Doppelganger' };
const EVENT_SECS = ['EnterDuration', 'GameDuration', 'ExitDuration'];
const EVENT_INTS: [string, string, number, number][] = [
  ['MaximumPlayerCount', 'Jugadores máximos', 1, 1000], ['MinimumCharacterLevel', 'Nivel mínimo', 0, 1000], ['MaximumCharacterLevel', 'Nivel máximo', 0, 1000],
  ['MinimumSpecialCharacterLevel', 'Nivel mínimo (clases especiales)', 0, 1000], ['MaximumSpecialCharacterLevel', 'Nivel máximo (clases especiales)', 0, 1000],
  ['TicketItemLevel', 'Nivel del ticket de entrada', 0, 15], ['EntranceFee', 'Zen para entrar', 0, 2147483647],
];
const EVENT_BOOLS: [string, string][] = [['RequiresMasterClass', 'Solo clases Master'], ['ArePlayerKillersAllowedToEnter', 'Pueden entrar los PK'], ['AllowParty', 'Se permite entrar en grupo']];

export async function listEvents(sql: Sql) {
  const rows = await sql.unsafe(
    `SELECT "Id" AS id, "Type" AS type, ${NAME('"Name"')} AS name, "GameLevel" AS "gameLevel",
            EXTRACT(EPOCH FROM "EnterDuration")::float8 AS "EnterDuration", EXTRACT(EPOCH FROM "GameDuration")::float8 AS "GameDuration", EXTRACT(EPOCH FROM "ExitDuration")::float8 AS "ExitDuration",
            ${[...EVENT_INTS, ...EVENT_BOOLS].map(([c]) => `"${c}"`).join(', ')}
     FROM config."MiniGameDefinition" ORDER BY "Type", "GameLevel"`
  );
  return { fields: { ints: EVENT_INTS.map(([key, label, min, max]) => ({ key, label, min, max })), bools: EVENT_BOOLS.map(([key, label]) => ({ key, label })), secs: EVENT_SECS }, events: rows.map(r => ({ ...r, typeName: GAMES[r.type as number] ?? String(r.type) })) };
}

export async function setEvent(sql: Sql, admin: string, id: string, b: Record<string, unknown>) {
  uuid(id, 'event');
  const cols: [string, unknown, string?][] = [];
  for (const [k, v] of Object.entries(b)) {
    const i = EVENT_INTS.find(x => x[0] === k), bo = EVENT_BOOLS.find(x => x[0] === k);
    if (i) cols.push([k, num(v, i[1], i[2], i[3])]);
    else if (bo) cols.push([k, bool(v, bo[1])]);
    else if (EVENT_SECS.includes(k)) cols.push([k, num(v, k, 0, 86400, false), 'make_interval(secs => $$::float8)']);
    else throw bad(`Unknown setting: ${k}.`);
  }
  if (cols.length === 0) throw bad('Nothing to change.');
  return write(sql, { admin, action: 'server.event', target: id, detail: { keys: cols.map(c => c[0]) } }, async w => { await patch(w, 'MiniGameDefinition', id, cols); return { ok: true }; });
}

/* ----------------------------------------------------------------- warps */

export const listWarps = (sql: Sql) =>
  sql.unsafe(
    `SELECT w."Id" AS id, w."Index" AS index, ${NAME('w."Name"')} AS name, w."Costs" AS costs, w."LevelRequirement" AS "levelRequirement", ${NAME('m."Name"')} AS map
     FROM config."WarpInfo" w LEFT JOIN config."ExitGate" g ON g."Id" = w."GateId" LEFT JOIN config."GameMapDefinition" m ON m."Id" = g."MapId" ORDER BY w."Index"`
  );

export async function setWarp(sql: Sql, admin: string, id: string, b: { costs?: unknown; levelRequirement?: unknown }) {
  uuid(id, 'warp');
  const cols: [string, unknown][] = [];
  if (b.costs !== undefined) cols.push(['Costs', num(b.costs, 'costs', 0, 2147483647)]);
  if (b.levelRequirement !== undefined) cols.push(['LevelRequirement', num(b.levelRequirement, 'levelRequirement', 0, 1000)]);
  if (cols.length === 0) throw bad('Nothing to change.');
  return write(sql, { admin, action: 'server.warp', target: id, detail: Object.fromEntries(cols) }, async w => { await patch(w, 'WarpInfo', id, cols); return { ok: true }; });
}

/* --------------------------------------------------------------- plug-ins */

// The database keeps only the id of each plug-in; the names come from OpenMU's own resources (plugin_names.json).
const NAMES = JSON.parse(readFileSync(join(import.meta.dir, 'plugin_names.json'), 'utf8')) as Record<string, { name: string; what: string }>;

/** Plug-ins with settings: event timetables, Happy Hour, invasions, chat commands and more. `config` is JSON text. */
export async function listPlugins(sql: Sql, all = false) {
  const rows = await sql.unsafe(`SELECT "Id" AS id, "TypeId" AS "typeId", "IsActive" AS "isActive", "CustomConfiguration" AS config FROM config."PlugInConfiguration" WHERE ($1 OR "CustomConfiguration" IS NOT NULL) ORDER BY 1`, [all]);
  return [...rows]
    .map(r => ({ id: r.id as string, isActive: r.isActive as boolean, config: r.config as string | null, name: NAMES[String(r.typeId).toLowerCase()]?.name ?? 'Plug-in sin nombre', what: NAMES[String(r.typeId).toLowerCase()]?.what ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function setPlugin(sql: Sql, admin: string, id: string, b: { isActive?: unknown; config?: unknown }) {
  uuid(id, 'plug-in');
  const cols: [string, unknown][] = [];
  if (b.isActive !== undefined) cols.push(['IsActive', bool(b.isActive, 'isActive')]);
  if (b.config !== undefined) {
    if (typeof b.config !== 'string' || b.config.length > 200_000) throw bad('config: JSON text up to 200000 characters.');
    try { JSON.parse(b.config); } catch (e) { throw bad(`config is not valid JSON: ${(e as Error).message}`); }
    cols.push(['CustomConfiguration', b.config]);
  }
  if (cols.length === 0) throw bad('Nothing to change.');
  const row = (await sql`SELECT "TypeId" AS "typeId" FROM config."PlugInConfiguration" WHERE "Id" = ${id}::uuid`)[0];
  if (!row) throw missing('No such plug-in setting.');
  const name = NAMES[String(row.typeId).toLowerCase()]?.name ?? String(row.typeId);
  return write(sql, { admin, action: 'server.plugin', target: name, detail: { keys: cols.map(c => c[0]) } }, async w => { await patch(w, 'PlugInConfiguration', id, cols); return { ok: true }; });
}
