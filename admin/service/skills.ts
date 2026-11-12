// Skills a character has learned (data."SkillEntry"): list, add, change the level (master skills), remove.
import type { Sql } from 'postgres';
import { bad, missing } from './errors';
import { gate, lineOfCharacter } from './classline';
import { write } from './undo';

const NAME = `split_part(s."Name", '||', 1)`;

/** Skills by name. With `character`, only those of that character's class line, each marked when a later evolution is needed. */
export async function searchSkills(sql: Sql, q = '', character = '') {
  const clean = q.replace(/[%_\\]/g, '');
  const line = character ? await lineOfCharacter(sql, character) : null;
  const rows = await sql.unsafe(
    `SELECT s."Id" AS id, s."Number" AS number, ${NAME} AS name, s."SkillType" AS "skillType", s."DamageType" AS "damageType",
            ARRAY(SELECT sc."CharacterClassId"::text FROM config."SkillCharacterClass" sc WHERE sc."SkillId" = s."Id") AS classes
     FROM config."Skill" s WHERE ${NAME} ILIKE $1
       AND ($3::uuid[] IS NULL OR EXISTS (SELECT 1 FROM config."SkillCharacterClass" sc WHERE sc."SkillId" = s."Id" AND sc."CharacterClassId" = ANY($3::uuid[])))
     ORDER BY (${NAME} ILIKE $2) DESC, s."Number" LIMIT 60`,
    ['%' + clean + '%', clean + '%', line ? `{${line.ids.join(',')}}` : null]
  );
  return rows.map(r => {
    const g = line ? gate(line, r.classes as string[]) : null;
    return { id: r.id, number: r.number, name: r.name, skillType: r.skillType, damageType: r.damageType, requires: g?.requires ?? null, needsEvolve: g?.needsEvolve ?? false };
  });
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

/** Skills of the character's whole class line (e.g. Dark Wizard, Soul Master, Grand Master), each with the class that first gets it. */
export async function availableSkills(sql: Sql, name: string) {
  const line = await lineOfCharacter(sql, name);
  const rows = await sql`
    SELECT s."Id" AS id, s."Number" AS number, split_part(s."Name", '||', 1) AS name, s."SkillType" AS "skillType", s."DamageType" AS "damageType",
           array_agg(sc."CharacterClassId"::text) AS classes,
           EXISTS (SELECT 1 FROM data."SkillEntry" e WHERE e."CharacterId" = ${line.charId} AND e."SkillId" = s."Id") AS has
    FROM config."Skill" s JOIN config."SkillCharacterClass" sc ON sc."SkillId" = s."Id"
    WHERE sc."CharacterClassId" = ANY(${line.ids}::uuid[])
    GROUP BY s."Id" ORDER BY s."Number"`;
  const skills = rows.map(r => {
    const g = gate(line, r.classes as string[])!;
    return { id: r.id, number: r.number, name: r.name, skillType: r.skillType, damageType: r.damageType, has: r.has, requires: g.requires, needsEvolve: g.needsEvolve };
  });
  return { chain: line.chain.map(k => k.name), current: line.chain[line.idx]?.name ?? null, skills };
}
