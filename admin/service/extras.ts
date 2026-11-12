// The smaller parts of a player's data: unlocked classes (account), quests, letters, Gens (character) and the cash shop storage (account).
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { lineOfCharacter } from './classline';
import { write } from './undo';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = (v: unknown, what: string): string => {
  if (typeof v !== 'string' || !UUID.test(v)) throw bad(`${what}: not a valid id.`);
  return v.toLowerCase();
};
const int = (v: unknown, name: string, min: number, max: number): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw bad(`${name}: a whole number from ${min} to ${max}.`);
  return v;
};
const text = (v: unknown, name: string, max: number, min = 0): string => {
  if (typeof v !== 'string' || v.length < min || v.length > max) throw bad(`${name}: ${min} to ${max} characters.`);
  return v;
};

async function accountOf(sql: Sql, login: string): Promise<string> {
  const r = await sql`SELECT "Id" AS id FROM data."Account" WHERE "LoginName" = ${login}`;
  if (!r[0]) throw missing('No such account.');
  return r[0].id as string;
}
async function charOf(sql: Sql, name: string): Promise<{ id: string; classId: string }> {
  const r = await sql`SELECT "Id" AS id, "CharacterClassId" AS "classId" FROM data."Character" WHERE "Name" = ${name}`;
  if (!r[0]) throw missing('No such character.');
  return { id: r[0].id as string, classId: r[0].classId as string };
}

/* ------------------------------------------------------------ unlocked classes */

/** Base classes (the first of each evolution chain) with whether the account has them unlocked for creation. */
export async function listUnlockedClasses(sql: Sql, login: string) {
  const id = await accountOf(sql, login);
  return sql`
    SELECT k."Id" AS id, split_part(k."Name", '||', 1) AS name, k."CanGetCreated" AS "createdByDefault",
           EXISTS (SELECT 1 FROM data."AccountCharacterClass" u WHERE u."AccountId" = ${id} AND u."CharacterClassId" = k."Id") AS unlocked
    FROM config."CharacterClass" k
    WHERE NOT EXISTS (SELECT 1 FROM config."CharacterClass" p WHERE p."NextGenerationClassId" = k."Id") AND NOT k."IsMasterClass"
    ORDER BY k."Number"`;
}

export async function setUnlockedClasses(sql: Sql, admin: string, login: string, ids: unknown) {
  const acc = await accountOf(sql, login);
  if (!Array.isArray(ids)) throw bad('classIds: a list of class ids.');
  const want = [...new Set(ids.map(i => uuid(i, 'classIds')))];
  if (want.length) {
    const ok = await sql`SELECT "Id" AS id FROM config."CharacterClass" WHERE "Id" = ANY(${want}::uuid[])`;
    if (ok.length !== want.length) throw bad('classIds: not a known class.');
  }
  return write(sql, { admin, action: 'account.classes', target: login, detail: { classes: want.length } }, async w => {
    await w.save('AccountCharacterClass', 'AccountId', [acc]);
    const have = (await w.tx`SELECT "CharacterClassId" AS c FROM data."AccountCharacterClass" WHERE "AccountId" = ${acc}`).map(r => r.c as string);
    for (const c of have.filter(c => !want.includes(c))) await w.tx`DELETE FROM data."AccountCharacterClass" WHERE "AccountId" = ${acc} AND "CharacterClassId" = ${c}::uuid`;
    for (const c of want.filter(c => !have.includes(c))) {
      await w.tx`INSERT INTO data."AccountCharacterClass" ("AccountId","CharacterClassId") VALUES (${acc}, ${c}::uuid)`;
      w.created('AccountCharacterClass', [{ AccountId: acc, CharacterClassId: c }]);
    }
  });
}

/* ---------------------------------------------------------------------- quests */

/** Quests for the character's class line: general ones and those of its classes. `needsEvolve` marks quests of a later class of the line. */
export async function listQuests(sql: Sql, name: string) {
  const line = await lineOfCharacter(sql, name);
  const c = { id: line.charId };
  const rows = await sql`
    SELECT q."Id" AS id, split_part(q."Name", '||', 1) AS name, q."Group" AS "group", q."Number" AS number, q."Repeatable" AS repeatable,
           q."MinimumCharacterLevel" AS "minLevel", q."QualifiedCharacterId"::text AS cls
    FROM config."QuestDefinition" q
    WHERE q."QualifiedCharacterId" IS NULL OR q."QualifiedCharacterId" = ANY(${line.ids}::uuid[])
    ORDER BY q."Group", q."Number"`;
  const quests = rows.map(q => {
    const at = q.cls ? line.ids.indexOf(q.cls as string) : -1;
    return { id: q.id, name: q.name, group: q.group, number: q.number, repeatable: q.repeatable, minLevel: q.minLevel, class: at >= 0 ? line.chain[at]!.name : null, needsEvolve: at > line.idx, tooLow: (q.minLevel as number) > line.level };
  });
  const states = await sql`
    SELECT s."Id" AS id, s."Group" AS "group", s."LastFinishedQuestId" AS "lastFinished", s."ActiveQuestId" AS active, s."ClientActionPerformed" AS "clientAction",
           (SELECT count(*)::int FROM data."QuestMonsterKillRequirementState" k WHERE k."CharacterQuestStateId" = s."Id") AS kills
    FROM data."CharacterQuestState" s WHERE s."CharacterId" = ${c.id} ORDER BY s."Group"`;
  return { quests, states };
}

/** Sets which quest of a group is finished last and which is active (null clears). Progress counters of the group are dropped. */
export async function setQuestState(sql: Sql, admin: string, name: string, groupRaw: unknown, b: Record<string, unknown>) {
  const c = await charOf(sql, name);
  const group = int(Number(groupRaw), 'group', 0, 32767);
  const pick = async (v: unknown, what: string): Promise<string | null> => {
    if (v === null || v === undefined || v === '') return null;
    const id = uuid(v, what);
    const q = (await sql`SELECT "Group" AS g FROM config."QuestDefinition" WHERE "Id" = ${id}::uuid`)[0];
    if (!q) throw bad(`${what}: not a known quest.`);
    if ((q.g as number) !== group) throw bad(`${what}: that quest belongs to another group.`);
    return id;
  };
  if (b.lastFinished === undefined && b.active === undefined && b.clientAction === undefined) throw bad('Send lastFinished, active or clientAction.');
  const cur = (await sql`SELECT "Id" AS id, "LastFinishedQuestId" AS lf, "ActiveQuestId" AS a, "ClientActionPerformed" AS ca FROM data."CharacterQuestState" WHERE "CharacterId" = ${c.id} AND "Group" = ${group}`)[0];
  const lf = b.lastFinished === undefined ? ((cur?.lf as string | null) ?? null) : await pick(b.lastFinished, 'lastFinished');
  const a = b.active === undefined ? ((cur?.a as string | null) ?? null) : await pick(b.active, 'active');
  const ca = b.clientAction === undefined ? !!cur?.ca : b.clientAction === true;
  return write(sql, { admin, action: 'quest.set', target: name, detail: { group, lastFinished: lf, active: a } }, async w => {
    if (cur) {
      await w.save('CharacterQuestState', 'Id', [cur.id as string]);
      await w.save('QuestMonsterKillRequirementState', 'CharacterQuestStateId', [cur.id as string]);
      await w.tx`DELETE FROM data."QuestMonsterKillRequirementState" WHERE "CharacterQuestStateId" = ${cur.id as string}`;
      await w.tx`UPDATE data."CharacterQuestState" SET "LastFinishedQuestId" = ${lf}, "ActiveQuestId" = ${a}, "ClientActionPerformed" = ${ca} WHERE "Id" = ${cur.id as string}`;
      return { id: cur.id };
    }
    const r = await w.tx`INSERT INTO data."CharacterQuestState" ("Id","LastFinishedQuestId","ActiveQuestId","CharacterId","Group","ClientActionPerformed") VALUES (gen_random_uuid(), ${lf}, ${a}, ${c.id}, ${group}, ${ca}) RETURNING "Id"`;
    w.created('CharacterQuestState', r as never);
    return { id: r[0]!.Id };
  });
}

/** Forgets the quest progress of one group (or of all groups): the character starts those quests over. */
export async function resetQuests(sql: Sql, admin: string, name: string, group?: number) {
  const c = await charOf(sql, name);
  const rows = await sql`SELECT "Id" AS id FROM data."CharacterQuestState" WHERE "CharacterId" = ${c.id} AND (${group ?? null}::int IS NULL OR "Group" = ${group ?? null})`;
  if (!rows.length) throw bad('There is no quest progress to reset.');
  const ids = rows.map(r => r.id as string);
  return write(sql, { admin, action: 'quest.reset', target: name, detail: { group: group ?? 'all', states: ids.length } }, async w => {
    await w.save('CharacterQuestState', 'Id', ids);
    await w.save('QuestMonsterKillRequirementState', 'CharacterQuestStateId', ids);
    await w.tx`DELETE FROM data."QuestMonsterKillRequirementState" WHERE "CharacterQuestStateId" = ANY(${ids}::uuid[])`;
    await w.tx`DELETE FROM data."CharacterQuestState" WHERE "Id" = ANY(${ids}::uuid[])`;
  });
}

/* --------------------------------------------------------------------- letters */

export async function listLetters(sql: Sql, name: string) {
  const c = await charOf(sql, name);
  return sql`
    SELECT h."Id" AS id, h."SenderName" AS sender, h."Subject" AS subject, h."LetterDate" AS date, h."ReadFlag" AS read, left(b."Message", 400) AS message
    FROM data."LetterHeader" h LEFT JOIN data."LetterBody" b ON b."HeaderId" = h."Id"
    WHERE h."ReceiverId" = ${c.id} OR h."CharacterId" = ${c.id} ORDER BY h."LetterDate" DESC LIMIT 100`;
}

export async function sendLetter(sql: Sql, admin: string, name: string, b: Record<string, unknown>) {
  const c = await charOf(sql, name);
  const sender = text(b.sender ?? 'Admin', 'sender', 10, 1);
  if (!/^[A-Za-z0-9_ ]+$/.test(sender)) throw bad('sender: letters, numbers, _ or spaces.');
  const subject = text(b.subject, 'subject', 32, 1);
  const message = text(b.message, 'message', 1000, 1);
  return write(sql, { admin, action: 'letter.send', target: name, detail: { sender, subject } }, async w => {
    const h = await w.tx`INSERT INTO data."LetterHeader" ("Id","ReceiverId","SenderName","Subject","LetterDate","ReadFlag","CharacterId") VALUES (gen_random_uuid(), ${c.id}, ${sender}, ${subject}, now(), false, ${c.id}) RETURNING "Id"`;
    w.created('LetterHeader', h as never);
    const r = await w.tx`INSERT INTO data."LetterBody" ("Id","HeaderId","SenderAppearanceId","Message","Rotation","Animation") VALUES (gen_random_uuid(), ${h[0]!.Id as string}, NULL, ${message}, 0, 0) RETURNING "Id"`;
    w.created('LetterBody', r as never);
    return { id: h[0]!.Id };
  });
}

export async function deleteLetter(sql: Sql, admin: string, name: string, letterId: string) {
  const c = await charOf(sql, name);
  const id = uuid(letterId, 'letter');
  const h = (await sql`SELECT "Id" AS id FROM data."LetterHeader" WHERE "Id" = ${id}::uuid AND ("ReceiverId" = ${c.id} OR "CharacterId" = ${c.id})`)[0];
  if (!h) throw missing('That letter is not on this character.');
  return write(sql, { admin, action: 'letter.delete', target: name, detail: { letter: id } }, async w => {
    await w.save('LetterHeader', 'Id', [id]);
    await w.save('LetterBody', 'HeaderId', [id]);
    await w.tx`DELETE FROM data."LetterBody" WHERE "HeaderId" = ${id}::uuid`;
    await w.tx`DELETE FROM data."LetterHeader" WHERE "Id" = ${id}::uuid`;
  });
}

/* ------------------------------------------------------------------------ Gens */

const GENS = ['none', 'Duprian', 'Vanert'];

export async function getGens(sql: Sql, name: string) {
  const c = await charOf(sql, name);
  const r = (await sql`SELECT "Gens" AS gens, "Contribution" AS contribution, "Rank" AS rank, "RankingPosition" AS "rankingPosition", "JoinedAt" AS "joinedAt" FROM data."GensMember" WHERE "CharacterId" = ${c.id}`)[0];
  return r ? { ...r, family: GENS[r.gens as number] ?? String(r.gens) } : { gens: 0, family: 'none', contribution: 0, rank: 0, rankingPosition: 0, joinedAt: null };
}

/** Joins or edits Gens (1 Duprian, 2 Vanert). */
export async function setGens(sql: Sql, admin: string, name: string, b: Record<string, unknown>) {
  const c = await charOf(sql, name);
  const cur = (await sql`SELECT "Id" AS id, "Gens" AS gens, "Contribution" AS contribution, "Rank" AS rank, "RankingPosition" AS pos FROM data."GensMember" WHERE "CharacterId" = ${c.id}`)[0];
  const gens = b.gens === undefined ? (cur?.gens as number | undefined) : int(b.gens, 'gens', 1, 2);
  if (gens === undefined) throw bad('gens: 1 Duprian or 2 Vanert.');
  const contribution = b.contribution === undefined ? ((cur?.contribution as number) ?? 0) : int(b.contribution, 'contribution', 0, 2_000_000_000);
  const rank = b.rank === undefined ? ((cur?.rank as number) ?? 0) : int(b.rank, 'rank', 0, 255);
  const pos = b.rankingPosition === undefined ? ((cur?.pos as number) ?? 0) : int(b.rankingPosition, 'rankingPosition', 0, 1_000_000);
  return write(sql, { admin, action: 'gens.set', target: name, detail: { gens, contribution, rank } }, async w => {
    if (cur) {
      await w.save('GensMember', 'Id', [cur.id as string]);
      await w.tx`UPDATE data."GensMember" SET "Gens" = ${gens}, "Contribution" = ${contribution}, "Rank" = ${rank}, "RankingPosition" = ${pos}, "LeftAt" = NULL WHERE "Id" = ${cur.id as string}`;
      return { id: cur.id };
    }
    const r = await w.tx`INSERT INTO data."GensMember" ("Id","CharacterId","Gens","Contribution","Rank","RankingPosition","JoinedAt") VALUES (gen_random_uuid(), ${c.id}, ${gens}, ${contribution}, ${rank}, ${pos}, now()) RETURNING "Id"`;
    w.created('GensMember', r as never);
    return { id: r[0]!.Id };
  });
}

export async function leaveGens(sql: Sql, admin: string, name: string) {
  const c = await charOf(sql, name);
  const cur = (await sql`SELECT "Id" AS id FROM data."GensMember" WHERE "CharacterId" = ${c.id}`)[0];
  if (!cur) throw bad('This character is not in a Gens family.');
  return write(sql, { admin, action: 'gens.leave', target: name }, async w => {
    await w.save('GensMember', 'Id', [cur.id as string]);
    await w.tx`DELETE FROM data."GensMember" WHERE "Id" = ${cur.id as string}`;
  });
}

/* ------------------------------------------------------------ cash shop storage */

export async function listCashShop(sql: Sql, login: string) {
  const id = await accountOf(sql, login);
  return sql`SELECT "Id" AS id, "ProductSequence" AS product, "PriceSequence" AS price, "IsGift" AS gift, "GiftSenderName" AS sender, "GiftMessage" AS message, "AddedAt" AS "addedAt"
    FROM data."CashShopStorageItem" WHERE "AccountId" = ${id} ORDER BY "AddedAt" DESC`;
}

export async function addCashShopItem(sql: Sql, admin: string, login: string, b: Record<string, unknown>) {
  const acc = await accountOf(sql, login);
  const product = int(b.product, 'product', 0, 2_000_000_000);
  const price = int(b.price ?? 0, 'price', 0, 2_000_000_000);
  const gift = b.gift === true;
  const sender = gift ? text(b.sender ?? '', 'sender', 10) : null;
  const message = gift ? text(b.message ?? '', 'message', 200) : null;
  return write(sql, { admin, action: 'cashshop.add', target: login, detail: { product, price, gift } }, async w => {
    const r = await w.tx`INSERT INTO data."CashShopStorageItem" ("Id","AccountId","ProductSequence","PriceSequence","IsGift","GiftSenderName","GiftMessage","AddedAt") VALUES (gen_random_uuid(), ${acc}, ${product}, ${price}, ${gift}, ${sender}, ${message}, now()) RETURNING "Id"`;
    w.created('CashShopStorageItem', r as never);
    return { id: r[0]!.Id };
  });
}

export async function deleteCashShopItem(sql: Sql, admin: string, login: string, itemId: string) {
  const acc = await accountOf(sql, login);
  const id = uuid(itemId, 'item');
  if (!(await sql`SELECT 1 FROM data."CashShopStorageItem" WHERE "Id" = ${id}::uuid AND "AccountId" = ${acc}`).length) throw missing('That item is not on this account.');
  return write(sql, { admin, action: 'cashshop.delete', target: login, detail: { item: id } }, async w => {
    await w.save('CashShopStorageItem', 'Id', [id]);
    await w.tx`DELETE FROM data."CashShopStorageItem" WHERE "Id" = ${id}::uuid`;
  });
}
