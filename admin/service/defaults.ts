// "Restablecer valores por defecto": puts a tab of the Servidor page back to what OpenMU shipped with.
// The shipped data is a snapshot of a fresh OpenMU database (`export-defaults.sh` makes it on the VM), kept in
// `defaults.json.gz` next to the undo files. A reset goes through `write()`, so «Registro» can undo it.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { EVENT_BOOLS, EVENT_INTS, EVENT_SECS, RULE_FIELDS } from './server';
import { DIR, type Row, type Writer, write } from './undo';

type Part = { table: string; cols: string[] };
type Tab = { label: string; parts?: Part[]; replace?: 'spawns' | 'shops' };

export const RESET_TABS: Record<string, Tab> = {
  rules: {
    label: 'Experiencia y reglas',
    parts: [
      { table: 'GameConfiguration', cols: RULE_FIELDS.map(f => f.key) },
      { table: 'GameServerDefinition', cols: ['Description', 'ExperienceRate', 'PvpEnabled'] },
      { table: 'GameServerConfiguration', cols: ['MaximumPlayers'] },
    ],
  },
  maps: { label: 'Mapas', parts: [{ table: 'GameMapDefinition', cols: ['ExpMultiplier'] }] },
  spawns: { label: 'Mobs y spots', replace: 'spawns' },
  monsters: {
    label: 'Monstruos',
    parts: [
      { table: 'MonsterDefinition', cols: ['RespawnDelay', 'MoveDelay', 'AttackDelay', 'NumberOfMaximumItemDrops', 'MoveRange', 'AttackRange', 'ViewRange'] },
      { table: 'MonsterAttribute', cols: ['Value'] },
    ],
  },
  drops: {
    label: 'Drops',
    parts: [
      { table: 'DropItemGroup', cols: ['Chance', 'MinimumMonsterLevel', 'MaximumMonsterLevel', 'ItemLevel'] },
      { table: 'ItemDropItemGroup', cols: ['Chance'] },
    ],
  },
  shops: { label: 'Tiendas', replace: 'shops' },
  events: { label: 'Eventos', parts: [{ table: 'MiniGameDefinition', cols: [...EVENT_SECS, ...EVENT_INTS.map(i => i[0]), ...EVENT_BOOLS.map(b => b[0])] }] },
  warps: { label: 'Teletransportes', parts: [{ table: 'WarpInfo', cols: ['Costs', 'LevelRequirement'] }] },
  plugins: { label: 'Avanzado', parts: [{ table: 'PlugInConfiguration', cols: ['IsActive', 'CustomConfiguration'] }] },
};

export type Defaults = Record<string, Row[]>;

export const defaultsFile = () => join(DIR, 'defaults.json.gz');

export function loadDefaults(file = defaultsFile()): Defaults | null {
  if (!existsSync(file)) return null;
  return JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as Defaults;
}

/** Which tabs can be reset and when the snapshot was made (null when the file is missing). */
export function resetInfo(file = defaultsFile()) {
  const has = existsSync(file);
  return { available: has, madeAt: has ? statSync(file).mtime.toISOString() : null, tabs: Object.fromEntries(Object.entries(RESET_TABS).map(([k, t]) => [k, t.label])) };
}

const q = (s: string) => `"${s}"`;
const tableOf = (name: string) => `config.${q(name)}`;
/** One row as text with its keys sorted, so two copies of the same row compare equal. */
export const canon = (r: Row) => JSON.stringify(Object.keys(r).sort().map(k => [k, r[k]]));

/** The SQL that sets the listed columns of the rows that differ from the defaults. Exported for the tests. */
export function updateSql(table: string, cols: string[]): { find: string; set: string } {
  const t = tableOf(table);
  const from = `jsonb_populate_recordset(NULL::${t}, $1::jsonb) r`;
  const differ = cols.map(c => `t.${q(c)} IS DISTINCT FROM r.${q(c)}`).join(' OR ');
  return {
    find: `SELECT t."Id" AS id FROM ${t} t JOIN ${from} ON t."Id" = r."Id" WHERE ${differ}`,
    set: `UPDATE ${t} t SET ${cols.map(c => `${q(c)} = r.${q(c)}`).join(', ')} FROM ${from} WHERE t."Id" = r."Id" AND t."Id" = ANY($2::uuid[])`,
  };
}

async function resetParts(w: Writer, parts: Part[], defaults: Defaults): Promise<number> {
  let changed = 0;
  for (const p of parts) {
    const rows = defaults[p.table];
    if (!rows) throw missing(`The defaults file has no ${p.table}.`);
    const sql = updateSql(p.table, p.cols);
    const ids = (await w.tx.unsafe(sql.find, [JSON.stringify(rows)])).map(r => r.id as string);
    if (ids.length === 0) continue;
    await w.save(`config.${p.table}`, 'Id', ids);
    await w.tx.unsafe(sql.set, [JSON.stringify(rows), ids as never]);
    changed += ids.length;
  }
  return changed;
}

/** Makes the rows of `table` that match the filter equal to `want`: deletes the extra ones and inserts the missing ones. */
async function replaceRows(w: Writer, table: string, saveTable: string, filter: string, params: unknown[], want: Row[]): Promise<{ deleted: number; inserted: number }> {
  const cur = (await w.tx.unsafe(`SELECT to_jsonb(t) AS j FROM ${table} t WHERE ${filter}`, params as never[])).map(r => r.j as Row);
  const wantKeys = new Set(want.map(canon));
  const curKeys = new Set(cur.map(canon));
  const extra = cur.filter(r => !wantKeys.has(canon(r)));
  const missingRows = want.filter(r => !curKeys.has(canon(r)));
  if (extra.length) {
    await w.save(saveTable, 'Id', extra.map(r => r.Id));
    await w.tx.unsafe(`DELETE FROM ${table} WHERE "Id" = ANY($1::uuid[])`, [extra.map(r => r.Id) as never]);
  }
  if (missingRows.length) {
    await w.tx.unsafe(`INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table}, $1::jsonb)`, [JSON.stringify(missingRows)]);
    const saved = new Set(extra.map(r => r.Id));
    w.created(saveTable, missingRows.filter(r => !saved.has(r.Id)).map(r => ({ Id: r.Id })));
  }
  return { deleted: extra.length, inserted: missingRows.length };
}

async function resetSpawns(w: Writer, defaults: Defaults): Promise<number> {
  const rows = defaults.MonsterSpawnArea;
  if (!rows) throw missing('The defaults file has no MonsterSpawnArea.');
  const r = await replaceRows(w, 'config."MonsterSpawnArea"', 'config.MonsterSpawnArea', 'true', [], rows);
  return r.deleted + r.inserted;
}

const withoutId = (r: Row) => canon({ ...r, Id: null, ItemStorageId: null });

/** Each NPC that sells things gets its default stock, found by the NPC number because the shop ids differ from server to server. */
async function resetShops(w: Writer, defaults: Defaults): Promise<number> {
  const stores = defaults.stores as { Number: number; Store: string }[] | undefined;
  const items = defaults.Item, links = defaults.ItemOptionLink ?? [], sets = defaults.ItemItemOfItemSet ?? [];
  if (!stores || !items) throw missing('The defaults file has no shops.');
  let changed = 0;
  for (const s of stores) {
    const live = (await w.tx.unsafe(`SELECT "MerchantStoreId" AS store FROM config."MonsterDefinition" WHERE "Number" = $1`, [s.Number]))[0]?.store as string | null | undefined;
    if (!live) continue;
    const want = items.filter(i => i.ItemStorageId === s.Store);
    const cur = (await w.tx.unsafe(`SELECT to_jsonb(t) AS j FROM data."Item" t WHERE t."ItemStorageId" = $1::uuid`, [live])).map(r => r.j as Row);
    const sig = (rows: Row[]) => rows.map(withoutId).sort().join('\n');
    if (sig(cur) === sig(want)) continue;
    const curIds = cur.map(r => r.Id as string);
    await w.save('ItemOptionLink', 'ItemId', curIds);
    await w.save('ItemItemOfItemSet', 'ItemId', curIds);
    await w.save('Item', 'Id', curIds);
    if (curIds.length) {
      await w.tx.unsafe(`DELETE FROM data."ItemOptionLink" WHERE "ItemId" = ANY($1::uuid[])`, [curIds as never]);
      await w.tx.unsafe(`DELETE FROM data."ItemItemOfItemSet" WHERE "ItemId" = ANY($1::uuid[])`, [curIds as never]);
      await w.tx.unsafe(`DELETE FROM data."Item" WHERE "Id" = ANY($1::uuid[])`, [curIds as never]);
    }
    const stock = want.map(r => ({ ...r, ItemStorageId: live }));
    const ids = new Set(stock.map(r => r.Id as string));
    const mine = (r: Row) => ids.has(r.ItemId as string);
    const put = async (table: string, rows: Row[]) => {
      if (rows.length) await w.tx.unsafe(`INSERT INTO data.${q(table)} SELECT * FROM jsonb_populate_recordset(NULL::data.${q(table)}, $1::jsonb)`, [JSON.stringify(rows)]);
    };
    await put('Item', stock);
    await put('ItemOptionLink', links.filter(mine));
    await put('ItemItemOfItemSet', sets.filter(mine));
    const saved = new Set(curIds);
    w.created('Item', stock.filter(r => !saved.has(r.Id as string)).map(r => ({ Id: r.Id })));
    w.created('ItemOptionLink', links.filter(mine).map(r => ({ Id: r.Id })));
    w.created('ItemItemOfItemSet', sets.filter(mine).map(r => ({ ItemId: r.ItemId, ItemOfItemSetId: r.ItemOfItemSetId })));
    changed += 1;
  }
  return changed;
}

/** Puts one tab back to the shipped values. Returns how many rows (or shops) changed. Undoable from «Registro». */
export async function resetTab(sql: Sql, admin: string, tab: string, defaults: Defaults | null = loadDefaults()) {
  const t = RESET_TABS[tab];
  if (!t) throw bad('Unknown tab.');
  if (!defaults) throw missing('Los valores por defecto aún no se generaron en el servidor (export-defaults.sh).');
  return write(sql, { admin, action: `server.reset.${tab}`, target: t.label, detail: { tab } }, async w => {
    const changed = t.parts ? await resetParts(w, t.parts, defaults) : t.replace === 'spawns' ? await resetSpawns(w, defaults) : await resetShops(w, defaults);
    return { changed };
  });
}
