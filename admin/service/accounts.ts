// Accounts: list, create, change password, ban. Same rules and same hash as the sign-up service (register/server/accounts.ts).
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { DIR, write } from './undo';

export const STATES = { normal: 0, gm: 2, banned: 4 } as const;
export type StateName = keyof typeof STATES;
const stateName = (n: number): string => Object.entries(STATES).find(([, v]) => v === n)?.[0] ?? String(n);

export function checkLogin(v: unknown): string {
  if (typeof v !== 'string' || !/^[A-Za-z0-9]{4,10}$/.test(v)) throw bad('Login: 4-10 letters or numbers.');
  return v;
}
export function checkPassword(v: unknown): string {
  if (typeof v !== 'string' || !/^[!-~]{4,10}$/.test(v)) throw bad('Password: 4-10 printable characters, no spaces.');
  return v;
}

/** OpenMU stores a bare `$2a$11$` BCrypt string. */
export async function hashPassword(password: string): Promise<string> {
  const h = await bcrypt.hash(password, 11);
  return h.startsWith('$2a$') ? h : '$2a$' + h.slice(h.indexOf('$', 1) + 1);
}

export async function listAccounts(sql: Sql, q = '') {
  const rows = await sql`
    SELECT a."LoginName" AS login, a."State" AS state, a."RegistrationDate" AS registered, a."EMail" AS email,
           (SELECT count(*)::int FROM data."Character" c WHERE c."AccountId" = a."Id") AS characters
    FROM data."Account" a WHERE a."LoginName" ILIKE ${'%' + q.replace(/[%_\\]/g, '') + '%'}
    ORDER BY a."RegistrationDate" DESC LIMIT 200`;
  return rows.map(r => ({ ...r, stateName: stateName(r.state as number) }));
}

export async function createAccount(sql: Sql, admin: string, login: unknown, password: unknown, state: unknown = 'normal') {
  const l = checkLogin(login);
  const p = checkPassword(password);
  if (typeof state !== 'string' || !(state in STATES) || state === 'banned') throw bad('State: normal or gm.');
  if ((await sql`SELECT 1 FROM data."Account" WHERE lower("LoginName") = lower(${l})`).length) throw bad('That login is taken.');
  const hash = await hashPassword(p);
  await write(sql, { admin, action: 'account.create', target: l, undoable: false, detail: { state } }, async w => {
    const rows = await w.tx`
      INSERT INTO data."Account" ("Id","LoginName","PasswordHash","SecurityCode","EMail","RegistrationDate","State","TimeZone","VaultPassword","IsVaultExtended")
      VALUES (gen_random_uuid(), ${l}, ${hash}, '', '', now(), ${STATES[state as StateName]}, 0, '', false) RETURNING "Id"`;
    w.created('Account', rows as never);
  });
  return { login: l };
}

async function idOf(sql: Sql, login: string): Promise<{ id: string; state: number }> {
  const r = await sql`SELECT "Id" AS id, "State" AS state FROM data."Account" WHERE "LoginName" = ${login}`;
  if (!r[0]) throw missing('No such account.');
  return r[0] as { id: string; state: number };
}

export async function setPassword(sql: Sql, admin: string, login: string, password: unknown) {
  const p = checkPassword(password);
  const a = await idOf(sql, login);
  const hash = await hashPassword(p);
  return write(sql, { admin, action: 'account.password', target: login }, async w => {
    await w.save('Account', 'Id', [a.id]);
    await w.tx`UPDATE data."Account" SET "PasswordHash" = ${hash} WHERE "Id" = ${a.id}`;
  });
}

const prevFile = () => join(DIR, 'prev-state.json');
const readPrev = (): Record<string, number> => (existsSync(prevFile()) ? JSON.parse(readFileSync(prevFile(), 'utf8')) : {});

/** Ban remembers the state it replaced, so unban gives it back. */
export async function setState(sql: Sql, admin: string, login: string, state: unknown) {
  if (typeof state !== 'string' || !(state in STATES)) throw bad('State: normal, gm or banned.');
  const a = await idOf(sql, login);
  const next = STATES[state as StateName];
  const prev = readPrev();
  if (state === 'banned' && a.state !== STATES.banned) {
    mkdirSync(DIR, { recursive: true, mode: 0o700 });
    writeFileSync(prevFile(), JSON.stringify({ ...prev, [login]: a.state }), { mode: 0o600 });
  }
  const value = state === 'normal' && a.state === STATES.banned ? (prev[login] ?? STATES.normal) : next;
  return write(sql, { admin, action: `account.${state === 'banned' ? 'ban' : 'state'}`, target: login, detail: { state: stateName(value) } }, async w => {
    await w.save('Account', 'Id', [a.id]);
    await w.tx`UPDATE data."Account" SET "State" = ${value} WHERE "Id" = ${a.id}`;
  });
}
