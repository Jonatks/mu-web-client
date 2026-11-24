import { describe, expect, it } from 'vitest';
import { decodeMapFile } from './decodeMapFile';
import { decryptMapFile } from './mapFileEncryption';

describe('decodeMapFile', () => {
  it('reads a Season 6 file with the map XOR', () => {
    const src = Uint8Array.from({ length: 64 }, (_, i) => (i * 37) & 0xff);
    const xor = new Uint8Array(src.length);
    decryptMapFile(xor, src, src.length);
    expect(decodeMapFile(src)).toEqual(xor);
  });

  it('sends a Season 16+ ATT / MAP header to ModulusCryptor', () => {
    const short = Uint8Array.from([0x41, 0x54, 0x54, 1, 0, 0]);
    expect(() => decodeMapFile(short)).toThrow('ModulusCryptor buffer is too short');
  });
});

describe('objRecordSize', () => {
  it('gives the Season 6 record and the larger newer ones', async () => {
    const { objRecordSize } = await import('./mapFileEncryption');
    expect([0, 1, 2, 3, 4, 5, 9].map(objRecordSize)).toEqual([30, 32, 33, 45, 46, 54, 30]);
  });
});
