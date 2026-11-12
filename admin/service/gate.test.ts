import { expect, test } from 'bun:test';
import { assertNobodyConnected, countConnected } from './gate';

const ct = (state: string, dport: number) =>
  `ipv4     2 tcp      6 431998 ${state} src=10.0.0.5 dst=155.181.133.84 sport=51234 dport=${dport} src=172.18.0.4 dst=10.0.0.5 sport=${dport} dport=51234 [ASSURED] mark=0 use=1`;

test('conntrack: counts established flows to a game port only', () => {
  expect(countConnected([ct('ESTABLISHED', 45901), ct('ESTABLISHED', 22), ct('TIME_WAIT', 45902)].join('\n'))).toBe(1);
  expect(countConnected('')).toBe(0);
});

test('tcp table: counts state 01 with a game port on either side', () => {
  const head = '  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode';
  const row = (l: string, r: string, st: string) => `   0: ${l} ${r} ${st} 00000000:00000000 00:00000000 00000000     0        0 1 1 0000 100 0 0 10 0`;
  const text = [head, row('0100007F:C350', '0100007F:B34D', '01'), row('0100007F:C351', '0100007F:B34D', '06'), row('0100007F:0016', '0100007F:1F90', '01')].join('\n');
  expect(countConnected(text)).toBe(1);
});

test('unknown text is not a source', () => {
  expect(countConnected('hello')).toBeNull();
});

test('the gate fails closed when nothing can be read', () => {
  expect(() => assertNobodyConnected(['/x'], () => { throw new Error('nope'); })).toThrow('cannot check');
  expect(() => assertNobodyConnected(['/x'], () => 'hello')).toThrow('cannot check');
});

test('the gate passes with an empty table and blocks with a connection', () => {
  expect(() => assertNobodyConnected(['/x'], () => ct('TIME_WAIT', 45901))).not.toThrow();
  expect(() => assertNobodyConnected(['/x'], () => ct('ESTABLISHED', 45901))).toThrow('connection');
});
