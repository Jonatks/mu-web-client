/** CAST-128, 3-Way, MARS, IDEA and GOST decryption as Crypto++ runs them (cast.cpp, 3way.cpp, mars.cpp, idea.cpp, gost.cpp). */

import { be, le, putBe, putLe, rotl, rotr } from './rc';
import { CAST_S, MARS_S } from './tables';
import type { BlockDecrypt } from './types';

const byte = (x: number, i: number) => (x >>> (8 * i)) & 0xff;

export function cast128(key: Uint8Array): BlockDecrypt {
  const sbox = (box: number, i: number) => CAST_S[box * 256 + i];
  const X = [be(key, 0), be(key, 4), be(key, 8), be(key, 12)];
  const Z = [0, 0, 0, 0];
  const K = new Uint32Array(32);
  const x = (i: number) => byte(X[i >> 2], 3 - (i & 3));
  const z = (i: number) => byte(Z[i >> 2], 3 - (i & 3));
  const s4 = (a: number, b: number, c: number, d: number) => sbox(4, a) ^ sbox(5, b) ^ sbox(6, c) ^ sbox(7, d);
  for (let i = 0; i <= 16; i += 16) {
    Z[0] = (X[0] ^ s4(x(0xd), x(0xf), x(0xc), x(0xe)) ^ sbox(6, x(0x8))) >>> 0;
    Z[1] = (X[2] ^ s4(z(0x0), z(0x2), z(0x1), z(0x3)) ^ sbox(7, x(0xa))) >>> 0;
    Z[2] = (X[3] ^ s4(z(0x7), z(0x6), z(0x5), z(0x4)) ^ sbox(4, x(0x9))) >>> 0;
    Z[3] = (X[1] ^ s4(z(0xa), z(0x9), z(0xb), z(0x8)) ^ sbox(5, x(0xb))) >>> 0;
    K[i + 0] = s4(z(0x8), z(0x9), z(0x7), z(0x6)) ^ sbox(4, z(0x2));
    K[i + 1] = s4(z(0xa), z(0xb), z(0x5), z(0x4)) ^ sbox(5, z(0x6));
    K[i + 2] = s4(z(0xc), z(0xd), z(0x3), z(0x2)) ^ sbox(6, z(0x9));
    K[i + 3] = s4(z(0xe), z(0xf), z(0x1), z(0x0)) ^ sbox(7, z(0xc));
    X[0] = (Z[2] ^ s4(z(0x5), z(0x7), z(0x4), z(0x6)) ^ sbox(6, z(0x0))) >>> 0;
    X[1] = (Z[0] ^ s4(x(0x0), x(0x2), x(0x1), x(0x3)) ^ sbox(7, z(0x2))) >>> 0;
    X[2] = (Z[1] ^ s4(x(0x7), x(0x6), x(0x5), x(0x4)) ^ sbox(4, z(0x1))) >>> 0;
    X[3] = (Z[3] ^ s4(x(0xa), x(0x9), x(0xb), x(0x8)) ^ sbox(5, z(0x3))) >>> 0;
    K[i + 4] = s4(x(0x3), x(0x2), x(0xc), x(0xd)) ^ sbox(4, x(0x8));
    K[i + 5] = s4(x(0x1), x(0x0), x(0xe), x(0xf)) ^ sbox(5, x(0xd));
    K[i + 6] = s4(x(0x7), x(0x6), x(0x8), x(0x9)) ^ sbox(6, x(0x3));
    K[i + 7] = s4(x(0x5), x(0x4), x(0xa), x(0xb)) ^ sbox(7, x(0x7));
    Z[0] = (X[0] ^ s4(x(0xd), x(0xf), x(0xc), x(0xe)) ^ sbox(6, x(0x8))) >>> 0;
    Z[1] = (X[2] ^ s4(z(0x0), z(0x2), z(0x1), z(0x3)) ^ sbox(7, x(0xa))) >>> 0;
    Z[2] = (X[3] ^ s4(z(0x7), z(0x6), z(0x5), z(0x4)) ^ sbox(4, x(0x9))) >>> 0;
    Z[3] = (X[1] ^ s4(z(0xa), z(0x9), z(0xb), z(0x8)) ^ sbox(5, x(0xb))) >>> 0;
    K[i + 8] = s4(z(0x3), z(0x2), z(0xc), z(0xd)) ^ sbox(4, z(0x9));
    K[i + 9] = s4(z(0x1), z(0x0), z(0xe), z(0xf)) ^ sbox(5, z(0xc));
    K[i + 10] = s4(z(0x7), z(0x6), z(0x8), z(0x9)) ^ sbox(6, z(0x2));
    K[i + 11] = s4(z(0x5), z(0x4), z(0xa), z(0xb)) ^ sbox(7, z(0x6));
    X[0] = (Z[2] ^ s4(z(0x5), z(0x7), z(0x4), z(0x6)) ^ sbox(6, z(0x0))) >>> 0;
    X[1] = (Z[0] ^ s4(x(0x0), x(0x2), x(0x1), x(0x3)) ^ sbox(7, z(0x2))) >>> 0;
    X[2] = (Z[1] ^ s4(x(0x7), x(0x6), x(0x5), x(0x4)) ^ sbox(4, z(0x1))) >>> 0;
    X[3] = (Z[3] ^ s4(x(0xa), x(0x9), x(0xb), x(0x8)) ^ sbox(5, z(0x3))) >>> 0;
    K[i + 12] = s4(x(0x8), x(0x9), x(0x7), x(0x6)) ^ sbox(4, x(0x3));
    K[i + 13] = s4(x(0xa), x(0xb), x(0x5), x(0x4)) ^ sbox(5, x(0x7));
    K[i + 14] = s4(x(0xc), x(0xd), x(0x3), x(0x2)) ^ sbox(6, x(0x8));
    K[i + 15] = s4(x(0xe), x(0xf), x(0x1), x(0x0)) ^ sbox(7, x(0xd));
  }
  for (let i = 16; i < 32; i++) K[i] &= 0x1f;
  const sb = (t: number) => [sbox(0, byte(t, 3)), sbox(1, byte(t, 2)), sbox(2, byte(t, 1)), sbox(3, byte(t, 0))];
  // Round functions f1, f2, f3 by round number mod 3.
  const f = (r: number, d: number, i: number): number => {
    const kind = i % 3;
    const t = rotl(kind === 0 ? (K[i] + d) >>> 0 : kind === 1 ? (K[i] ^ d) >>> 0 : (K[i] - d) >>> 0, K[i + 16]);
    const [a, b, c, e] = sb(t);
    const v = kind === 0 ? (((a ^ b) - c) >>> 0) + e : kind === 1 ? (((a - b) >>> 0) + c) ^ e : (((a + b) >>> 0) ^ c) - e;
    return (r ^ v) >>> 0;
  };
  return {
    size: 8,
    decrypt(blk, at) {
      let r = be(blk, at);
      let l = be(blk, at + 4);
      for (let i = 15; i >= 0; i -= 2) {
        r = f(r, l, i);
        l = f(l, r, i - 1);
      }
      putBe(blk, at, l);
      putBe(blk, at + 4, r);
    },
  };
}

const reverseBits = (a: number) => {
  a = ((a & 0xaaaaaaaa) >>> 1) | ((a & 0x55555555) << 1);
  a = ((a & 0xcccccccc) >>> 2) | ((a & 0x33333333) << 2);
  return (((a & 0xf0f0f0f0) >>> 4) | ((a & 0x0f0f0f0f) << 4)) >>> 0;
};
const byteReverse = (a: number) => ((a << 24) | ((a & 0xff00) << 8) | ((a >>> 8) & 0xff00) | (a >>> 24)) >>> 0;
const mu = (a: number[]) => {
  const t = reverseBits(a[0]);
  a[1] = reverseBits(a[1]);
  a[0] = reverseBits(a[2]);
  a[2] = t;
};
const theta = (a: number[]) => {
  let c = a[0] ^ a[1] ^ a[2];
  c = rotl(c >>> 0, 16) ^ rotl(c >>> 0, 8);
  const b0 = (a[0] << 24) ^ (a[2] >>> 8) ^ (a[1] << 8) ^ (a[0] >>> 24);
  const b1 = (a[1] << 24) ^ (a[0] >>> 8) ^ (a[2] << 8) ^ (a[1] >>> 24);
  a[0] = (a[0] ^ c ^ b0) >>> 0;
  a[1] = (a[1] ^ c ^ b1) >>> 0;
  a[2] = (a[2] ^ c ^ (b0 >>> 16) ^ (b1 << 16)) >>> 0;
};
const piGammaPi = (a: number[]) => {
  const b2 = rotl(a[2], 1);
  const b0 = rotl(a[0], 22);
  a[0] = rotl((b0 ^ (a[1] | ~b2)) >>> 0, 1);
  a[2] = rotl((b2 ^ (b0 | ~a[1])) >>> 0, 22);
  a[1] = (a[1] ^ (b2 | ~b0)) >>> 0;
};

export function threeWay(key: Uint8Array): BlockDecrypt {
  const k = [be(key, 0), be(key, 4), be(key, 8)];
  theta(k);
  mu(k);
  for (let i = 0; i < 3; i++) k[i] = byteReverse(k[i]);
  return {
    size: 12,
    decrypt(blk, at) {
      const a = [le(blk, at), le(blk, at + 4), le(blk, at + 8)];
      let rc = 0xb1b1;
      mu(a);
      for (let i = 0; i < 11; i++) {
        a[0] = (a[0] ^ k[0] ^ (rc << 16)) >>> 0;
        a[1] = (a[1] ^ k[1]) >>> 0;
        a[2] = (a[2] ^ k[2] ^ rc) >>> 0;
        theta(a);
        piGammaPi(a);
        rc <<= 1;
        if (rc & 0x10000) rc ^= 0x11011;
      }
      a[0] = (a[0] ^ k[0] ^ (rc << 16)) >>> 0;
      a[1] = (a[1] ^ k[1]) >>> 0;
      a[2] = (a[2] ^ k[2] ^ rc) >>> 0;
      theta(a);
      mu(a);
      putLe(blk, at, a[0]);
      putLe(blk, at + 4, a[1]);
      putLe(blk, at + 8, a[2]);
    },
  };
}

export function mars(key: Uint8Array): BlockDecrypt {
  const T = new Uint32Array(15);
  for (let i = 0; i < 16; i++) T[i >> 2] |= key[i] << (8 * (i & 3));
  T[4] = 4;
  const k = new Uint32Array(40);
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 15; i++) T[i] = T[i] ^ rotl((T[(i + 8) % 15] ^ T[(i + 13) % 15]) >>> 0, 3) ^ (4 * i + j);
    for (let n = 0; n < 4; n++) for (let i = 0; i < 15; i++) T[i] = rotl((T[i] + MARS_S[T[(i + 14) % 15] % 512]) >>> 0, 9);
    for (let i = 0; i < 10; i++) k[10 * j + i] = T[(4 * i) % 15];
  }
  for (let i = 5; i < 37; i += 2) {
    let w = (k[i] | 3) >>> 0;
    let m = (~w ^ (w << 1)) & (~w ^ (w >>> 1)) & 0x7ffffffe;
    m &= m >>> 1;
    m &= m >>> 2;
    m &= m >>> 4;
    m |= m << 1;
    m |= m << 2;
    m |= m << 4;
    m &= 0x7ffffffc;
    w ^= rotl(MARS_S[265 + (k[i] & 3)], k[i - 1]) & m;
    k[i] = w;
  }
  const s0 = (a: number) => MARS_S[a & 0xff];
  const s1 = (a: number) => MARS_S[(a & 0xff) + 256];
  return {
    size: 16,
    decrypt(blk, at) {
      let d = (le(blk, at) + k[36]) >>> 0;
      let c = (le(blk, at + 4) + k[37]) >>> 0;
      let b = (le(blk, at + 8) + k[38]) >>> 0;
      let a = (le(blk, at + 12) + k[39]) >>> 0;
      let t: number;
      for (let i = 0; i < 8; i++) {
        b = ((b ^ s0(a)) + s1(a >>> 8)) >>> 0;
        c = (c + s0(a >>> 16)) >>> 0;
        a = rotr(a, 24);
        d = (d ^ s1(a)) >>> 0;
        if (i % 4 === 0) a = (a + d) >>> 0;
        if (i % 4 === 1) a = (a + b) >>> 0;
        t = a;
        a = b;
        b = c;
        c = d;
        d = t;
      }
      for (let i = 0; i < 16; i++) {
        t = rotr(a, 13);
        const r = rotl(Math.imul(a, k[35 - 2 * i]) >>> 0, 10);
        const m = (t + k[34 - 2 * i]) >>> 0;
        const l = rotl((MARS_S[m & 0x1ff] ^ rotr(r, 5) ^ r) >>> 0, r);
        c = (c - rotl(m, rotr(r, 5))) >>> 0;
        if (i < 8) {
          b = (b - l) >>> 0;
          d = (d ^ r) >>> 0;
        } else {
          d = (d - l) >>> 0;
          b = (b ^ r) >>> 0;
        }
        a = b;
        b = c;
        c = d;
        d = t;
      }
      for (let i = 0; i < 8; i++) {
        if (i % 4 === 2) a = (a - d) >>> 0;
        if (i % 4 === 3) a = (a - b) >>> 0;
        b = (b ^ s1(a)) >>> 0;
        c = (c - s0(a >>> 24)) >>> 0;
        t = rotl(a, 24);
        d = ((d - s1(a >>> 16)) ^ s0(t)) >>> 0;
        a = b;
        b = c;
        c = d;
        d = t;
      }
      putLe(blk, at, d - k[0]);
      putLe(blk, at + 4, c - k[1]);
      putLe(blk, at + 8, b - k[2]);
      putLe(blk, at + 12, a - k[3]);
    },
  };
}

/** Multiplication modulo 65537, 0 standing for 65536. */
const ideaMul = (a: number, b: number) => {
  if (a === 0) return (1 - b) & 0xffff;
  if (b === 0) return (1 - a) & 0xffff;
  const p = a * b;
  const lo = p & 0xffff;
  const hi = p >>> 16;
  return (lo - hi + (lo < hi ? 1 : 0)) & 0xffff;
};
const ideaInv = (x: number) => {
  let y = x;
  for (let i = 0; i < 15; i++) y = ideaMul(ideaMul(y, y), x);
  return y;
};

export function idea(key: Uint8Array): BlockDecrypt {
  const ROUNDS = 8;
  const en = new Array<number>(6 * ROUNDS + 4);
  for (let i = 0; i < 8; i++) en[i] = (key[2 * i] << 8) | key[2 * i + 1];
  for (let i = 8; i < en.length; i++) {
    const j = (i & ~7) - 8;
    en[i] = ((en[j + ((i + 1) % 8)] << 9) | (en[j + ((i + 2) % 8)] >>> 7)) & 0xffff;
  }
  const z = new Array<number>(en.length);
  const add = (x: number) => -x & 0xffff;
  let i = 0;
  for (; i < ROUNDS; i++) {
    const j = (ROUNDS - i) * 6;
    z[i * 6] = ideaInv(en[j]);
    z[i * 6 + 1] = add(en[j + 1 + (i > 0 ? 1 : 0)]);
    z[i * 6 + 2] = add(en[j + 2 - (i > 0 ? 1 : 0)]);
    z[i * 6 + 3] = ideaInv(en[j + 3]);
    z[i * 6 + 4] = en[(ROUNDS - 1 - i) * 6 + 4];
    z[i * 6 + 5] = en[(ROUNDS - 1 - i) * 6 + 5];
  }
  z[i * 6] = ideaInv(en[0]);
  z[i * 6 + 1] = add(en[1]);
  z[i * 6 + 2] = add(en[2]);
  z[i * 6 + 3] = ideaInv(en[3]);
  return {
    size: 8,
    decrypt(blk, at) {
      const w = (o: number) => (blk[at + o] << 8) | blk[at + o + 1];
      let x0 = w(0);
      let x1 = w(2);
      let x2 = w(4);
      let x3 = w(6);
      for (let r = 0; r < ROUNDS; r++) {
        const k = r * 6;
        x0 = ideaMul(x0, z[k]);
        x1 = (x1 + z[k + 1]) & 0xffff;
        x2 = (x2 + z[k + 2]) & 0xffff;
        x3 = ideaMul(x3, z[k + 3]);
        let t0 = ideaMul(x0 ^ x2, z[k + 4]);
        const t1 = ideaMul((t0 + (x1 ^ x3)) & 0xffff, z[k + 5]);
        t0 = (t0 + t1) & 0xffff;
        x0 ^= t1;
        x3 ^= t0;
        t0 ^= x1;
        x1 = x2 ^ t1;
        x2 = t0;
      }
      const k = ROUNDS * 6;
      const out = [ideaMul(x0, z[k]), (x2 + z[k + 1]) & 0xffff, (x1 + z[k + 2]) & 0xffff, ideaMul(x3, z[k + 3])];
      out.forEach((v, n) => {
        blk[at + 2 * n] = v >>> 8;
        blk[at + 2 * n + 1] = v;
      });
    },
  };
}

const GOST_BOX = [
  [4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3],
  [14, 11, 4, 12, 6, 13, 15, 10, 2, 3, 8, 1, 0, 7, 5, 9],
  [5, 8, 1, 13, 10, 3, 4, 2, 14, 15, 12, 7, 6, 0, 9, 11],
  [7, 13, 10, 1, 0, 8, 9, 15, 14, 4, 6, 12, 11, 2, 5, 3],
  [6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14, 0, 3, 11, 2],
  [4, 11, 10, 0, 7, 2, 1, 13, 3, 6, 8, 5, 9, 12, 15, 14],
  [13, 11, 4, 1, 3, 15, 5, 9, 0, 10, 14, 7, 6, 8, 2, 12],
  [1, 15, 13, 0, 5, 7, 10, 4, 9, 2, 3, 14, 6, 11, 8, 12],
];
let gostTable: Uint32Array | null = null;

export function gost(key: Uint8Array): BlockDecrypt {
  const st = (gostTable ??= (() => {
    const s = new Uint32Array(1024);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 256; j++) s[i * 256 + j] = rotl(GOST_BOX[2 * i][j % 16] | (GOST_BOX[2 * i + 1][j >> 4] << 4), 11 + 8 * i);
    return s;
  })());
  const k = Array.from({ length: 8 }, (_, i) => le(key, 4 * i));
  const f = (x: number) => {
    const t = x >>> 0;
    return st[768 + byte(t, 3)] ^ st[512 + byte(t, 2)] ^ st[256 + byte(t, 1)] ^ st[byte(t, 0)];
  };
  return {
    size: 8,
    decrypt(blk, at) {
      let n1 = le(blk, at);
      let n2 = le(blk, at + 4);
      for (let i = 0; i < 8; i += 2) {
        n2 = (n2 ^ f(n1 + k[i])) >>> 0;
        n1 = (n1 ^ f(n2 + k[i + 1])) >>> 0;
      }
      for (let r = 0; r < 3; r++)
        for (let i = 7; i > 0; i -= 2) {
          n2 = (n2 ^ f(n1 + k[i])) >>> 0;
          n1 = (n1 ^ f(n2 + k[i - 1])) >>> 0;
        }
      putLe(blk, at, n2);
      putLe(blk, at + 4, n1);
    },
  };
}
