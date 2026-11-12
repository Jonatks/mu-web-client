// Every write goes through `write()`: the rows it will touch are saved as JSON first, the change runs in one
// transaction, and the saved copy plus an audit line are written before the commit. `undo()` puts the rows back.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Sql } from 'postgres';

export type Row = Record<string, unknown>;

/** Tables the service may write, with their primary key. Anything else is refused. */
const TABLES: Record<string, string[]> = {
  Account: ['Id'],
  Character: ['Id'],
  ItemStorage: ['Id'],
  StatAttribute: ['Id'],
  Item: ['Id'],
  ItemOptionLink: ['Id'],
  ItemItemOfItemSet: ['ItemId', 'ItemOfItemSetId'],
};
/** Restore parents before children; delete children before parents. */
const ORDER = ['Account', 'ItemStorage', 'Character', 'Item', 'StatAttribute', 'ItemOptionLink', 'ItemItemOfItemSet'];

export const DIR = process.env.ADMIN_DATA_DIR ?? '/var/lib/mu-admin';
const undoDir = () => join(DIR, 'undo');
const auditFile = () => join(DIR, 'audit.jsonl');

export type Record_ = {
  id: string;
  at: string;
  admin: string;
  action: string;
  target: string;
  undoable: boolean;
  before: Record<string, Row[]>;
  created: Record<string, Row[]>;
};

/** What a write may do inside its transaction. */
export type Writer = {
  tx: Sql;
  /** Save these rows (by key column) before they are changed or deleted. */
  save(table: string, column: string, values: unknown[]): Promise<void>;
  /** Remember rows the write inserts, so an undo deletes them. */
  created(table: string, rows: Row[]): void;
};

const ident = (table: string) => {
  if (!TABLES[table]) throw new Error(`table not allowed: ${table}`);
  return `data."${table}"`;
};

export async function write<T>(
  sql: Sql,
  meta: { admin: string; action: string; target: string; undoable?: boolean; detail?: Row },
  fn: (w: Writer) => Promise<T>
): Promise<{ result: T; undoId: string }> {
  mkdirSync(undoDir(), { recursive: true, mode: 0o700 });
  const rec: Record_ = {
    id: `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
    at: new Date().toISOString(),
    admin: meta.admin,
    action: meta.action,
    target: meta.target,
    undoable: meta.undoable ?? true,
    before: {},
    created: {},
  };
  const result = (await sql.begin(async t => {
    const tx = t as unknown as Sql;
    const w: Writer = {
      tx,
      async save(table, column, values) {
        if (values.length === 0) return;
        const rows = await tx.unsafe(`SELECT to_jsonb(t) AS j FROM ${ident(table)} t WHERE t."${column}" = ANY($1::uuid[])`, [values as string[]]);
        (rec.before[table] ??= []).push(...rows.map(r => r.j as Row));
      },
      created(table, rows) {
        ident(table);
        (rec.created[table] ??= []).push(...rows);
      },
    };
    const out = await fn(w);
    writeFileSync(join(undoDir(), `${rec.id}.json`), JSON.stringify(rec), { mode: 0o600 });
    appendFileSync(auditFile(), JSON.stringify({ id: rec.id, at: rec.at, admin: rec.admin, action: rec.action, target: rec.target, undoable: rec.undoable, detail: meta.detail ?? null }) + '\n', { mode: 0o600 });
    return out;
  })) as T;
  return { result, undoId: rec.id };
}

const keyWhere = (pk: string[]) => pk.map((c, i) => `t."${c}" = $${i + 1}`).join(' AND ');

/** Puts back what a write changed. Needs the same gate as the write itself. */
export async function undo(sql: Sql, id: string, admin: string): Promise<{ undoId: string }> {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('bad undo id');
  const file = join(undoDir(), `${id}.json`);
  if (!existsSync(file)) throw new Error('nothing to undo with that id (already undone or unknown)');
  const rec = JSON.parse(readFileSync(file, 'utf8')) as Record_;
  if (!rec.undoable) throw new Error('that action cannot be undone');
  const { undoId } = await write(sql, { admin, action: `undo:${rec.action}`, target: rec.target, undoable: false, detail: { undoes: id } }, async w => {
    for (const table of ORDER) {
      const pk = TABLES[table]!;
      const cols = (await w.tx.unsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema='data' AND table_name=$1`, [table])).map(r => r.column_name as string);
      const sets = cols.filter(c => !pk.includes(c)).map(c => `"${c}" = r."${c}"`).join(', ');
      for (const row of rec.before[table] ?? []) {
        const hit = await w.tx.unsafe(
          `UPDATE ${ident(table)} t SET ${sets} FROM jsonb_populate_record(NULL::${ident(table)}, $${pk.length + 1}::jsonb) r WHERE ${keyWhere(pk)}`,
          [...pk.map(c => row[c] as string), row as never]
        );
        if (hit.count === 0) await w.tx.unsafe(`INSERT INTO ${ident(table)} SELECT * FROM jsonb_populate_record(NULL::${ident(table)}, $1::jsonb)`, [row as never]);
      }
    }
    for (const table of [...ORDER].reverse()) {
      const pk = TABLES[table]!;
      for (const row of rec.created[table] ?? []) {
        await w.tx.unsafe(`DELETE FROM ${ident(table)} t WHERE ${keyWhere(pk)}`, pk.map(c => row[c] as string));
      }
    }
  });
  renameSync(file, `${file}.done`);
  return { undoId };
}

export function recentUndo(limit = 30): { id: string; at: string; admin: string; action: string; target: string; undoable: boolean }[] {
  if (!existsSync(undoDir())) return [];
  return readdirSync(undoDir())
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-limit)
    .reverse()
    .map(f => {
      const r = JSON.parse(readFileSync(join(undoDir(), f), 'utf8')) as Record_;
      return { id: r.id, at: r.at, admin: r.admin, action: r.action, target: r.target, undoable: r.undoable };
    });
}

export function auditTail(limit = 100): Row[] {
  if (!existsSync(auditFile())) return [];
  return readFileSync(auditFile(), 'utf8').trim().split('\n').filter(Boolean).slice(-limit).reverse().map(l => JSON.parse(l) as Row);
}
