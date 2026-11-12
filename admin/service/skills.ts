// Skills a character has learned (data."SkillEntry"): list, add, change the level (master skills), remove.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { write } from './undo';

const NAME = `split_part(s."Name", '||', 1)`;

export async function searchSkills(sql: Sql, q = '') {
  return sql.unsafe(`SELECT s."Id" AS id, s."Number" AS number, ${NAME} AS name FROM config."Skill" s WHERE ${NAME} ILIKE $1 ORDER BY (${NAME} ILIKE $2) DESC, s."Number" LIMIT 60`, ['%' + q.replace(/[%_\\]/g, '') + '%', q.replace(/[%_\\]/g, '') + '%']);
}

async function charId(sql: Sql, name: string): Promise<string> {
  const r = await sql`SELECT "Id" AS id FROM data."Character" WHERE "Name" = ${name}`;
  if (!r[0]) throw missing('No such character.');
  return r[0].id as string;
}

export async function listSkills(sql: Sql, name: string) {
  const id = await charId(sql, name);
  return sql.unsafe(`SELECT e."Id" AS id, e."SkillId" AS "skillId", e."Level" AS level, s."Number" AS number, ${NAME} AS name
    FROM data."SkillEntry" e JOIN config."Skill" s ON s."Id" = e."SkillId" WHERE e."CharacterId" = $1 ORDER BY s."Number"`, [id]);
}

const level = (v: unknown) => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 255) throw bad('level: a whole number from 0 to 255.');
  return v;
};

export async function addSkill(sql: Sql, admin: string, name: string, skillId: unknown, lvl: unknown = 0) {
  const id = await charId(sql, name);
  const l = level(lvl);
  const sk = (await sql`SELECT "Id" AS id, split_part("Name", '||', 1) AS name FROM config."Skill" WHERE "Id" = ${String(skillId)}::uuid`.catch(() => []))[0];
  if (!sk) throw bad('Unknown skill.');
  if ((await sql`SELECT 1 FROM data."SkillEntry" WHERE "CharacterId" = ${id} AND "SkillId" = ${sk.id as string}`).length) throw bad('The character already has that skill.');
  return write(sql, { admin, action: 'skill.add', target: name, detail: { skill: sk.name, level: l } }, async w => {
    const r = await w.tx`INSERT INTO data."SkillEntry" ("Id","CharacterId","SkillId","Level") VALUES (gen_random_uuid(), ${id}, ${sk.id as string}, ${l}) RETURNING "Id"`;
    w.created('SkillEntry', r as never);
    return { id: r[0]!.Id };
  });
}

async function entry(sql: Sql, name: string, entryId: string) {
  const id = await charId(sql, name);
  const r = await sql`SELECT "Id" AS id FROM data."SkillEntry" WHERE "Id" = ${entryId}::uuid AND "CharacterId" = ${id}`.catch(() => []);
  if (!r[0]) throw missing('That skill is not on this character.');
}

export async function setSkillLevel(sql: Sql, admin: string, name: string, entryId: string, lvl: unknown) {
  await entry(sql, name, entryId);
  const l = level(lvl);
  return write(sql, { admin, action: 'skill.level', target: name, detail: { entryId, level: l } }, async w => {
    await w.save('SkillEntry', 'Id', [entryId]);
    await w.tx`UPDATE data."SkillEntry" SET "Level" = ${l} WHERE "Id" = ${entryId}::uuid`;
  });
}

export async function removeSkill(sql: Sql, admin: string, name: string, entryId: string) {
  await entry(sql, name, entryId);
  return write(sql, { admin, action: 'skill.remove', target: name, detail: { entryId } }, async w => {
    await w.save('SkillEntry', 'Id', [entryId]);
    await w.tx`DELETE FROM data."SkillEntry" WHERE "Id" = ${entryId}::uuid`;
  });
}
