import { expect, test } from 'bun:test';
import { assertNobodyConnected, countSockets } from './gate';

const head = '  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode';
const row = (l: string, r: string, st: string) => `   0: ${l} ${r} ${st} 00000000:00000000 00:00000000 00000000     0        0 1 1 0000 100 0 0 10 0`;

test('listening and connected sockets are told apart, and other ports ignored', () => {
  const text = [
    head,
    row('00000000:B34D', '00000000:0000', '0A'), // 45901 listens
    row('0A00000A:B34D', '0100007F:C350', '01'), // a player on 45901
    row('0A00000A:B34E', '0100007F:C351', '06'), // closing
    row('0A00000A:0016', '0100007F:C352', '01'), // ssh
  ].join('\n');
  expect(countSockets(text)).toEqual({ listening: 1, established: 1 });
});

const file = (o: object) => () => JSON.stringify(o);

test('the gate passes with fresh data, listeners and nobody connected', () => {
  expect(() => assertNobodyConnected('/x', 10_000, file({ at: 5_000, listening: 6, established: 0 }))).not.toThrow();
});

test('it blocks when somebody is connected', () => {
  expect(() => assertNobodyConnected('/x', 10_000, file({ at: 9_000, listening: 6, established: 2 }))).toThrow('2 connection');
});

test('it fails closed on a missing, stale or listener-less file', () => {
  expect(() => assertNobodyConnected('/x', 1, () => { throw new Error('no'); })).toThrow('cannot check');
  expect(() => assertNobodyConnected('/x', 100_000, file({ at: 1_000, listening: 6, established: 0 }))).toThrow('stale');
  expect(() => assertNobodyConnected('/x', 10_000, file({ at: 9_000, listening: 0, established: 0 }))).toThrow('not listening');
});
