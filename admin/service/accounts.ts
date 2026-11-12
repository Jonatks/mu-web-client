// Accounts: list, create, change password, ban. Same rules and same hash as the sign-up service (register/server/accounts.ts).
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { columnsOf, refuseIfUsed } from './schema';
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

const OPTIONAL = { language: 'LanguageIsoCode', timeZone: 'TimeZone', chatBanUntil: 'ChatBanUntil', wcoinC: 'WCoinC', wcoinP: 'WCoinP', goblinPoints: 'GoblinPoints' } as const;

/** What the Advanced panel shows. Secrets are reported as present or not, never returned. Fields this OpenMU version lacks are left out. */
export async function getAccount(sql: Sql, login: string) {
  const cols = await columnsOf(sql, 'Account');
  const extra = Object.entries(OPTIONAL).filter(([, c]) => cols.has(c)).map(([k, c]) => `, "${c}" AS "${k}"`).join('');
  const r = await sql.unsafe(
    `SELECT "LoginName" AS login, "State" AS state, "EMail" AS email, "RegistrationDate" AS registered,
            ("SecurityCode" <> '') AS "hasSecurityCode", ("VaultPassword" <> '') AS "hasVaultPassword", "IsVaultExtended" AS "vaultExtended"${extra}
     FROM data."Account" WHERE "LoginName" = $1`, [login]);
  if (!r[0]) throw missing('No such account.');
  return { ...r[0], stateName: stateName(r[0].state as number) };
}

const whole = (v: unknown, name: string, lo: number, hi: number): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < lo || v > hi) throw bad(`${name}: a whole number from ${lo} to ${hi}.`);
  return v;
};

/** Advanced edits: login, email, security code, vault password, extended vault, language, time zone, chat ban, cash shop coins. Only the fields sent change. */
export async function patchAccount(sql: Sql, admin: string, login: string, body: Record<string, unknown>) {
  const known = ['login', 'email', 'securityCode', 'clearVaultPassword', 'vaultExtended', ...Object.keys(OPTIONAL)];
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some(k => !known.includes(k))) throw bad(`Editable fields: ${known.join(', ')}.`);
  const a = await idOf(sql, login);
  const cols = await columnsOf(sql, 'Account');
  const email = body.email === undefined ? null : String(body.email);
  if (email !== null && email !== '' && !/^[^\s@]{1,64}@[^\s@]{1,120}$/.test(email)) throw bad('email: not a valid address (or empty).');
  const code = body.securityCode === undefined ? null : String(body.securityCode);
  if (code !== null && !/^[0-9]{0,7}$/.test(code)) throw bad('securityCode: up to 7 digits (or empty).');
  if (body.clearVaultPassword !== undefined && body.clearVaultPassword !== true) throw bad('clearVaultPassword: true.');
  if (body.vaultExtended !== undefined && typeof body.vaultExtended !== 'boolean') throw bad('vaultExtended: true or false.');
  const newLogin = body.login === undefined ? null : checkLogin(body.login);
  if (newLogin !== null && newLogin.toLowerCase() !== login.toLowerCase() && (await sql`SELECT 1 FROM data."Account" WHERE lower("LoginName") = lower(${newLogin})`).length) throw bad('That login is taken.');
  const set: [string, unknown][] = [];
  for (const [k, col] of Object.entries(OPTIONAL)) {
    if (body[k] === undefined) continue;
    if (!cols.has(col)) throw bad(`${k}: this OpenMU version has no such field.`);
    let v: unknown;
    if (k === 'language') { if (typeof body[k] !== 'string' || !/^[a-z]{2,3}$/.test(body[k] as string)) throw bad('language: 2 or 3 lowercase letters (en, es, de).'); v = body[k]; }
    else if (k === 'chatBanUntil') { v = body[k] === null ? null : new Date(String(body[k])).toISOString(); }
    else if (k === 'timeZone') v = whole(body[k], k, -12, 14);
    else v = whole(body[k], k, 0, 2147483647);
    set.push([col, v]);
  }
  return write(sql, { admin, action: 'account.edit', target: login, detail: { fields: keys } }, async w => {
    await w.save('Account', 'Id', [a.id]);
    if (email !== null) await w.tx`UPDATE data."Account" SET "EMail" = ${email} WHERE "Id" = ${a.id}`;
    if (code !== null) await w.tx`UPDATE data."Account" SET "SecurityCode" = ${code} WHERE "Id" = ${a.id}`;
    if (body.clearVaultPassword === true) await w.tx`UPDATE data."Account" SET "VaultPassword" = '' WHERE "Id" = ${a.id}`;
    if (typeof body.vaultExtended === 'boolean') await w.tx`UPDATE data."Account" SET "IsVaultExtended" = ${body.vaultExtended} WHERE "Id" = ${a.id}`;
    if (newLogin !== null) await w.tx`UPDATE data."Account" SET "LoginName" = ${newLogin} WHERE "Id" = ${a.id}`;
    for (const [col, v] of set) await w.tx.unsafe(`UPDATE data."Account" SET "${col}" = $1 WHERE "Id" = $2`, [v as never, a.id]);
  });
}

/** Deletes an account that has no characters left, with its vault. Delete its characters first (each one can be undone). */
export async function deleteAccount(sql: Sql, admin: string, login: string, confirm: unknown) {
  if (confirm !== login) throw bad('confirm: send the exact login to delete the account.');
  const a = await idOf(sql, login);
  if ((await sql`SELECT 1 FROM data."Character" WHERE "AccountId" = ${a.id} LIMIT 1`).length) throw bad('The account still has characters. Delete them first.');
  const vault = (await sql`SELECT "VaultId" AS v FROM data."Account" WHERE "Id" = ${a.id}`)[0]?.v as string | null;
  const items = vault ? (await sql`SELECT "Id" FROM data."Item" WHERE "ItemStorageId" = ${vault}`).map(r => r.Id as string) : [];
  await refuseIfUsed(sql, 'Account', [a.id], [], login);
  if (items.length) await refuseIfUsed(sql, 'Item', items, ['ItemOptionLink.ItemId', 'ItemItemOfItemSet.ItemId'], `An item of ${login}`);
  return write(sql, { admin, action: 'account.delete', target: login, detail: { items: items.length } }, async w => {
    await w.save('Account', 'Id', [a.id]);
    if (vault) {
      await w.save('ItemStorage', 'Id', [vault]);
      await w.save('Item', 'ItemStorageId', [vault]);
      await w.save('ItemOptionLink', 'ItemId', items);
      await w.save('ItemItemOfItemSet', 'ItemId', items);
    }
    await w.tx`DELETE FROM data."ItemOptionLink" WHERE "ItemId" = ANY(${items}::uuid[])`;
    await w.tx`DELETE FROM data."ItemItemOfItemSet" WHERE "ItemId" = ANY(${items}::uuid[])`;
    await w.tx`DELETE FROM data."Item" WHERE "Id" = ANY(${items}::uuid[])`;
    await w.tx`DELETE FROM data."Account" WHERE "Id" = ${a.id}`;
    if (vault) await w.tx`DELETE FROM data."ItemStorage" WHERE "Id" = ${vault}`;
  });
}
