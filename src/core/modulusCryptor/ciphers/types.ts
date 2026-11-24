/** One block cipher in ECB decryption: `size` bytes per block, decrypted in place at `at`. */
export type BlockDecrypt = { readonly size: number; decrypt(block: Uint8Array, at: number): void };
