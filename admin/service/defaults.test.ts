import { expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { RESET_TABS, canon, loadDefaults, rekey, resetInfo, updateSql } from './defaults';

test('every tab of the Servidor page can be reset', () => {
  expect(Object.keys(RESET_TABS)).toEqual(['rules', 'maps', 'spawns', 'monsters', 'drops', 'shops', 'events', 'warps', 'plugins']);
  for (const t of Object.values(RESET_TABS)) expect(Boolean(t.parts) !== Boolean(t.replace)).toBe(true);
});

test('the rules tab resets what the rules tab edits', () => {
  const cols = RESET_TABS.rules!.parts![0]!.cols;
  expect(cols).toContain('ExperienceRate');
  expect(cols).toContain('MaximumLevel');
});

test('the update only touches rows that differ and only the listed columns', () => {
  const sql = updateSql('WarpInfo', ['Costs', 'LevelRequirement']);
  expect(sql.find).toContain('"Costs" IS DISTINCT FROM r."Costs" OR t."LevelRequirement" IS DISTINCT FROM r."LevelRequirement"');
  expect(sql.set).toContain('SET "Costs" = r."Costs", "LevelRequirement" = r."LevelRequirement"');
  expect(sql.set).toContain('t."Id" = ANY($2::uuid[])');
});

test('two copies of a row compare equal whatever the key order', () => {
  expect(canon({ b: 1, a: 'x' })).toBe(canon({ a: 'x', b: 1 }));
  expect(canon({ a: 1 })).not.toBe(canon({ a: 2 }));
});

test('the snapshot is read from a gzip file, and its absence is reported', () => {
  const dir = mkdtempSync(join(tmpdir(), 'defaults-'));
  const file = join(dir, 'defaults.json.gz');
  expect(loadDefaults(file)).toBeNull();
  expect(resetInfo(file).available).toBe(false);
  writeFileSync(file, gzipSync(JSON.stringify({ WarpInfo: [{ Id: 'x', Costs: 1 }] })));
  expect(loadDefaults(file)?.WarpInfo?.[0]?.Costs).toBe(1);
  expect(resetInfo(file).available).toBe(true);
});

test('rows whose Id changed are matched by their key, and ambiguous ones are left alone', () => {
  const live = [{ Id: 'a', Index: 1 }, { Id: 'b', Index: 2 }, { Id: 'c', Index: 3 }, { Id: 'd', Index: 3 }];
  const want = [{ Id: 'a', Index: 1 }, { Id: 'x', Index: 2 }, { Id: 'y', Index: 3 }, { Id: 'z', Index: 9 }];
  expect(rekey(want, live, ['Index'])).toEqual([{ Id: 'a', Index: 1 }, { Id: 'b', Index: 2 }]);
});
