// What the installed OpenMU version actually has: columns that differ between versions are checked once, then cached.
import type { Sql } from 'postgres';
import { bad } from './errors';

const cache = new Map<string, Set<string>>();

export async function columnsOf(sql: Sql, table: string, schema = 'data'): Promise<Set<string>> {
  const key = `${schema}.${table}`;
  let c = cache.get(key);
  if (!c) {
    const r = await sql`SELECT column_name AS c FROM information_schema.columns WHERE table_schema = ${schema} AND table_name = ${table}`;
    c = new Set(r.map(x => x.c as string));
    cache.set(key, c);
  }
  return c;
}

/** The tables (and columns) with a foreign key to `table`, so a delete can refuse when something unknown still points at the row. */
export async function referencing(sql: Sql, table: string): Promise<{ table: string; column: string }[]> {
  const r = await sql`
    SELECT cl.relname AS t, a.attname AS c
    FROM pg_constraint k
    JOIN pg_class cl ON cl.oid = k.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'data'
    JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey)
    WHERE k.contype = 'f' AND k.confrelid = ${`data."${table}"`}::regclass`;
  return r.map(x => ({ table: x.t as string, column: x.c as string }));
}

/** Throws a plain message when rows of tables outside `known` still point at `ids`. */
export async function refuseIfUsed(sql: Sql, table: string, ids: string[], known: string[], what: string): Promise<void> {
  if (ids.length === 0) return;
  for (const ref of await referencing(sql, table)) {
    if (known.includes(`${ref.table}.${ref.column}`)) continue;
    const n = await sql.unsafe(`SELECT count(*)::int AS n FROM data."${ref.table}" WHERE "${ref.column}" = ANY($1::uuid[])`, [ids]);
    if ((n[0]!.n as number) > 0) throw bad(`${what} still has data in ${ref.table} (${n[0]!.n} rows) that this panel does not handle. Remove it in the game first.`);
  }
}
