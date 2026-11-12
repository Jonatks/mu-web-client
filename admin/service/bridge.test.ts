import { expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { disconnectAccount, readOnline } from './bridge';

const dir = () => mkdtempSync(join(tmpdir(), 'bridge-'));

test('reads the players the plugin wrote, in either letter case', () => {
  const d = dir();
  writeFileSync(join(d, 'players.json'), JSON.stringify({ at: new Date().toISOString(), players: [{ Login: 'saruri01', Character: 'Saruri', Map: 'Lorencia', X: 130, Y: 120 }] }));
  expect(readOnline(d)?.players).toEqual([{ login: 'saruri01', character: 'Saruri', map: 'Lorencia', x: 130, y: 120 }]);
});

test('an old or missing file means the plugin is not running', async () => {
  const d = dir();
  expect(readOnline(d)).toBeNull();
  writeFileSync(join(d, 'players.json'), JSON.stringify({ at: new Date(Date.now() - 60_000).toISOString(), players: [] }));
  expect(readOnline(d)).toBeNull();
  await expect(disconnectAccount(d, 'saruri01', 'me')).rejects.toThrow();
});

test('refuses names that are not accounts', async () => {
  await expect(disconnectAccount(dir(), 'a b;c', 'me')).rejects.toThrow();
});

test('a file that starts with a byte order mark still reads', () => {
  const d = dir();
  writeFileSync(join(d, 'players.json'), '\uFEFF' + JSON.stringify({ at: new Date().toISOString(), players: [] }));
  expect(readOnline(d)?.players).toEqual([]);
});
