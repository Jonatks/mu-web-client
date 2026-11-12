// A character's class line: the base class and its evolutions (Dark Wizard, Soul Master, Grand Master), and where the character stands in it.
import type { Sql } from 'postgres';
import { missing } from './errors';

export type Line = { chain: { id: string; name: string }[]; idx: number; ids: string[] };

export async function lineOfClass(sql: Sql, classId: string): Promise<Line> {
  const classes = await sql`SELECT "Id" AS id, "NextGenerationClassId" AS next, split_part("Name", '||', 1) AS name FROM config."CharacterClass"`;
  const byId = new Map(classes.map(k => [k.id as string, k]));
  let root = classId;
  for (let hop = 0; hop < 10; hop++) {
    const prev = classes.find(k => k.next === root);
    if (!prev) break;
    root = prev.id as string;
  }
  const chain: { id: string; name: string }[] = [];
  for (let cur: string | null = root; cur && chain.length < 10; cur = (byId.get(cur)?.next as string | null) ?? null) chain.push({ id: cur, name: byId.get(cur)!.name as string });
  return { chain, idx: Math.max(0, chain.findIndex(k => k.id === classId)), ids: chain.map(k => k.id) };
}

export async function lineOfCharacter(sql: Sql, name: string): Promise<Line & { charId: string; level: number }> {
  const c = (await sql`SELECT c."Id" AS id, c."CharacterClassId" AS cls,
      COALESCE((SELECT sa."Value" FROM data."StatAttribute" sa JOIN config."AttributeDefinition" d ON d."Id" = sa."DefinitionId" WHERE sa."CharacterId" = c."Id" AND d."Designation" = 'Level'), 0)::int AS level
    FROM data."Character" c WHERE c."Name" = ${name}`)[0];
  if (!c) throw missing('No such character.');
  return { ...(await lineOfClass(sql, c.cls as string)), charId: c.id as string, level: c.level as number };
}

/** For something limited to some classes: the first class of the line that has it, and whether the character is still below it. null = nobody in the line can use it. */
export function gate(line: Line, classes: string[]): { requires: string | null; needsEvolve: boolean } | null {
  if (classes.length === 0) return { requires: null, needsEvolve: false };
  const at = classes.map(id => line.ids.indexOf(id)).filter(i => i >= 0);
  if (!at.length) return null;
  const first = Math.min(...at);
  return { requires: line.chain[first]!.name, needsEvolve: first > line.idx };
}
