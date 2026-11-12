import { expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanLog, logStats } from './logclean';

const DAY = 86_400_000;
const id = (ms: number, n: string) => `${ms.toString(36)}-${n}`;
function setup(entries: { ago: number; action: string; undo?: 'live' | 'done' }[]) {
  const d = mkdtempSync(join(tmpdir(), 'clean-'));
  mkdirSync(join(d, 'undo'));
  const lines = entries.map((e, i) => {
    const ms = Date.now() - e.ago * DAY, eid = id(ms, String(i));
    if (e.undo) writeFileSync(join(d, 'undo', eid + (e.undo === 'live' ? '.json' : '.json.done')), '{}');
    return JSON.stringify({ id: eid, at: new Date(ms).toISOString(), admin: 'a', action: e.action, target: 't' });
  });
  writeFileSync(join(d, 'audit.jsonl'), lines.join('\n') + '\n');
  return d;
}
const left = (d: string) => readFileSync(join(d, 'audit.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l).action as string);

test('removes old lines, keeps recent ones', () => {
  const d = setup([{ ago: 40, action: 'a.old' }, { ago: 1, action: 'a.new' }]);
  expect(cleanLog(d, { before: Date.now() - 7 * DAY, undo: false })).toMatchObject({ removedEntries: 1, keptEntries: 1 });
  expect(left(d)).toEqual(['a.new', 'log.clean']);
});

test('a change that can still be undone stays unless asked', () => {
  const d = setup([{ ago: 40, action: 'item.add', undo: 'live' }, { ago: 40, action: 'item.add', undo: 'done' }]);
  const r = cleanLog(d, { before: Date.now() - 7 * DAY, undo: false });
  expect(r.removedEntries).toBe(1);
  expect(r.removedUndoFiles).toBe(1);
  const r2 = cleanLog(d, { before: null, undo: true });
  expect(r2.removedEntries).toBe(2);
  expect(existsSync(join(d, 'undo'))).toBe(true);
  expect(logStats(d).undoable).toBe(0);
});

test('server settings waiting for a restart are never removed', () => {
  const d = setup([{ ago: 30, action: 'server.rules', undo: 'live' }, { ago: 20, action: 'server.restart' }, { ago: 10, action: 'server.drop', undo: 'live' }, { ago: 10, action: 'item.add' }]);
  const r = cleanLog(d, { before: null, undo: true });
  expect(r.removedEntries).toBe(2);
  expect(left(d).slice(0, 2)).toEqual(['server.restart', 'server.drop']);
  expect(logStats(d).undoable).toBe(1);
});

test('a dry run changes nothing', () => {
  const d = setup([{ ago: 40, action: 'x' }, { ago: 41, action: 'y' }]);
  expect(cleanLog(d, { before: null, undo: true, dryRun: true }).removedEntries).toBe(2);
  expect(logStats(d).entries).toBe(2);
});
