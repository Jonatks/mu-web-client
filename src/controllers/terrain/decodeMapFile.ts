import { modulusDecrypt } from '../assets/bmd';
import { decryptMapFile } from './mapFileEncryption';

/** The ATT / MAP header newer clients (Season 16+) put before a ModulusCryptor body instead of the map XOR. */
const MODULUS_TAGS = ['ATT', 'MAP'];

/** A map file's plain bytes: ModulusCryptor after an `ATT\x01` / `MAP\x01` header, the map XOR otherwise. */
export function decodeMapFile(src: Uint8Array): Uint8Array {
  const tag = String.fromCharCode(src[0], src[1], src[2]);
  if (src.length > 4 && src[3] === 1 && MODULUS_TAGS.includes(tag)) return modulusDecrypt(src.subarray(4));
  const out = new Uint8Array(src.length);
  decryptMapFile(out, src, src.length);
  return out;
}
