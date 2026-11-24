/** TEA, RC5 and RC6 decryption with Crypto++'s defaults (tea.cpp, rc5.cpp, rc6.cpp): 32, 16 and 20 rounds. */

import type { BlockDecrypt } from './types';

const DELTA = 0x9e3779b9;
const P = 0xb7e15163;
const Q = 0x9e3779b9;
const rotl = (x: number, n: number) => ((x << (n & 31)) | (x >>> ((32 - (n & 31)) & 31))) >>> 0;
const rotr = (x: number, n: number) => ((x >>> (n & 31)) | (x << ((32 - (n & 31)) & 31))) >>> 0;
const be = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
const le = (b: Uint8Array, at: number) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;
const putBe = (b: Uint8Array, at: number, v: number) => {
  b[at] = v >>> 24;
  b[at + 1] = v >>> 16;
  b[at + 2] = v >>> 8;
  b[at + 3] = v;
};
export const putLe = (b: Uint8Array, at: number, v: number) => {
  b[at] = v;
  b[at + 1] = v >>> 8;
  b[at + 2] = v >>> 16;
  b[at + 3] = v >>> 24;
};
export { be, le, putBe, rotl, rotr };

export function tea(key: Uint8Array): BlockDecrypt {
  const k = [be(key, 0), be(key, 4), be(key, 8), be(key, 12)];
  const limit = Math.imul(32, DELTA) >>> 0;
  return {
    size: 8,
    decrypt(b, at) {
      let y = be(b, at);
      let z = be(b, at + 4);
      for (let sum = limit; sum !== 0; sum = (sum - DELTA) >>> 0) {
        z = (z - ((((y << 4) + k[2]) ^ (y + sum) ^ ((y >>> 5) + k[3])) >>> 0)) >>> 0;
        y = (y - ((((z << 4) + k[0]) ^ (z + sum) ^ ((z >>> 5) + k[1])) >>> 0)) >>> 0;
      }
      putBe(b, at, y);
      putBe(b, at + 4, z);
    },
  };
}

/** RC5/RC6 key table: `2 * (rounds + 1)` or `2 * (rounds + 2)` words. */
function rcTable(key: Uint8Array, size: number): Uint32Array {
  const c = Math.max(1, Math.ceil(key.length / 4));
  const l = new Uint32Array(c);
  for (let i = 0; i < key.length; i++) l[i >> 2] |= key[i] << (8 * (i & 3));
  const s = new Uint32Array(size);
  s[0] = P;
  for (let j = 1; j < size; j++) s[j] = s[j - 1] + Q;
  let a = 0;
  let b = 0;
  for (let h = 0; h < 3 * Math.max(size, c); h++) {
    a = s[h % size] = rotl((s[h % size] + a + b) >>> 0, 3);
    b = l[h % c] = rotl((l[h % c] + a + b) >>> 0, (a + b) >>> 0);
  }
  return s;
}

/** `r` is 16 in Crypto++ (and so in the client); the RC5 paper's vectors use 12. */
export function rc5(key: Uint8Array, r = 16): BlockDecrypt {
  const s = rcTable(key.subarray(0, 16), 2 * (r + 1));
  return {
    size: 8,
    decrypt(blk, at) {
      let a = le(blk, at);
      let b = le(blk, at + 4);
      for (let i = r; i >= 1; i--) {
        b = (rotr((b - s[2 * i + 1]) >>> 0, a) ^ a) >>> 0;
        a = (rotr((a - s[2 * i]) >>> 0, b) ^ b) >>> 0;
      }
      putLe(blk, at, a - s[0]);
      putLe(blk, at + 4, b - s[1]);
    },
  };
}

export function rc6(key: Uint8Array): BlockDecrypt {
  const r = 20;
  const s = rcTable(key.subarray(0, 16), 2 * (r + 2));
  return {
    size: 16,
    decrypt(blk, at) {
      let a = le(blk, at);
      let b = le(blk, at + 4);
      let c = le(blk, at + 8);
      let d = le(blk, at + 12);
      c = (c - s[2 * r + 3]) >>> 0;
      a = (a - s[2 * r + 2]) >>> 0;
      for (let i = r; i >= 1; i--) {
        const t0 = a;
        a = d;
        d = c;
        c = b;
        b = t0;
        const u = rotl(Math.imul(d, 2 * d + 1) >>> 0, 5);
        const t = rotl(Math.imul(b, 2 * b + 1) >>> 0, 5);
        c = (rotr((c - s[2 * i + 1]) >>> 0, t) ^ u) >>> 0;
        a = (rotr((a - s[2 * i]) >>> 0, u) ^ t) >>> 0;
      }
      putLe(blk, at, a);
      putLe(blk, at + 4, b - s[0]);
      putLe(blk, at + 8, c);
      putLe(blk, at + 12, d - s[1]);
    },
  };
}
