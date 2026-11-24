/**
 * Webzen's ModulusCryptor, which wraps BMD version 14 models (and newer OZD/ATT/MAP files): byte 1
 * picks the cipher that unlocks the first, middle and last 1 KB with a fixed key, byte 0 the cipher
 * that then decrypts everything after the 34-byte header with the 32-byte key stored at byte 2.
 */

import type { BlockDecrypt } from './ciphers/types';
import { CIPHERS } from './ciphers';

const FIXED_KEY = Uint8Array.from('webzen#@!01webzen#@!01webzen#@!0', c => c.charCodeAt(0));
const HEADER = 34;

const run = (cipher: BlockDecrypt, buf: Uint8Array, at: number, length: number) => {
  for (let i = at; i + cipher.size <= at + length; i += cipher.size) cipher.decrypt(buf, i);
};

/** The plain bytes of a ModulusCryptor buffer (its 34-byte header dropped). */
export function modulusDecrypt(source: Uint8Array): Uint8Array {
  if (source.length < HEADER) throw new Error('ModulusCryptor buffer is too short');
  const buf = source.slice();
  const dataSize = buf.length - HEADER;
  const first = CIPHERS[buf[1] & 7](FIXED_KEY);
  const block = 1024 - (1024 % first.size);
  if (dataSize > 4 * block) run(first, buf, 2 + (dataSize >>> 1), block);
  if (dataSize > block) {
    run(first, buf, buf.length - block, block);
    run(first, buf, 2, block);
  }
  const second = CIPHERS[buf[0] & 7](buf.slice(2, 34));
  run(second, buf, HEADER, dataSize - (dataSize % second.size));
  return buf.slice(HEADER);
}
