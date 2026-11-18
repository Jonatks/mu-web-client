import { describe, expect, it } from 'vitest';
import { CIPHERS } from './ciphers';
import { rc5 } from './ciphers/rc';
import { modulusDecrypt } from './modulusCryptor';

const hex = (s: string) => Uint8Array.from((s.match(/../g) ?? []).map(x => parseInt(x, 16)));
const toHex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');

// Known answers from Crypto++ TestData / TestVectors (key, ciphertext, plaintext).
const VECTORS: [string, (key: Uint8Array) => { size: number; decrypt(b: Uint8Array, at: number): void }, string, string, string][] = [
  ['TEA', CIPHERS[0], '00000000000000000000000000000000', '41ea3a0a94baa940', '0000000000000000'],
  ['3-Way', CIPHERS[1], 'def01234456789abbcdef012', '0aa55dbb9cdddb6d7cdb76b2', '234567899abcdef001234567'],
  ['CAST-128', CIPHERS[2], '0123456712345678234567893456789a', '238b4fe5847e44b2', '0123456789abcdef'],
  ['RC5-32/12', k => rc5(k, 12), '915f4619be41b2516355a50110a9ce91', 'f7c013ac5b2b8952', '21a5dbee154b8f6d'],
  ['RC6', CIPHERS[4], '00000000000000000000000000000000', '8fc3a53656b1f778c129df4e9848a41e', '00000000000000000000000000000000'],
  ['MARS', CIPHERS[5], '80000000000000000000000000000000', 'b3e2ad5608ac1b6733a7cb4fdf8f9952', '00000000000000000000000000000000'],
  ['IDEA', CIPHERS[6], '00010002000300040005000600070008', '540e5fea18c2f8b1', '0102030405060708'],
  ['GOST', CIPHERS[7], 'be5ec2006cff9dcf52354959f1ff0cbfe95061b5a648c10387069c25997c0672', '07f9027df7f7df89', '0df82802b741a292'],
];

describe('ModulusCryptor ciphers', () => {
  it.each(VECTORS)('%s decrypts its known answer', (_, make, key, cipher, plain) => {
    const block = hex(cipher);
    make(hex(key)).decrypt(block, 0);
    expect(toHex(block)).toBe(plain);
  });
});

describe('modulusDecrypt', () => {
  it('decrypts a short buffer with the second cipher and its stored key, dropping the 34-byte header', () => {
    // Under 1 KB only the second cipher runs: TEA (byte 0 = 0) with the 32 bytes at 2 as key.
    const buf = new Uint8Array(34 + 8);
    buf.set(hex('41ea3a0a94baa940'), 34);
    expect(toHex(modulusDecrypt(buf))).toBe('0000000000000000');
  });
});
