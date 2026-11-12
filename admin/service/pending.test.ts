import { expect, test } from 'bun:test';
import { pendingChanges } from './server';

// The log is newest first.
const L = (id: string, action: string, at: string, detail?: unknown) => ({ id, action, at, detail });

test('changes since the last restart count, older ones do not', () => {
  const log = [L('c', 'server.map', '3'), L('b', 'server.rules', '2'), L('r', 'server.restart', '1'), L('a', 'server.rules', '0')];
  expect(pendingChanges(log)).toEqual({ pending: 2, lastRestart: '1' });
});

test('a change and its undo cancel out', () => {
  const log = [L('u', 'undo:server.rules', '3', { undoes: 'b' }), L('b', 'server.rules', '2'), L('x', 'account.edit', '1')];
  expect(pendingChanges(log).pending).toBe(0);
});

test('undoing a change made before the restart is pending again', () => {
  const log = [L('u', 'undo:server.rules', '3', { undoes: 'a' }), L('r', 'server.restart', '2'), L('a', 'server.rules', '1')];
  expect(pendingChanges(log).pending).toBe(1);
});

test('with no restart in the log every server change counts', () => {
  expect(pendingChanges([L('a', 'server.warp', '1'), L('p', 'account.ban', '0')])).toEqual({ pending: 1, lastRestart: null });
});
