import { cast128, gost, idea, mars, threeWay } from './others';
import { rc5, rc6, tea } from './rc';
import type { BlockDecrypt } from './types';

/** By ModulusCryptor algorithm number: TEA, 3-Way, CAST-128, RC5, RC6, MARS, IDEA, GOST. */
export const CIPHERS: readonly ((key: Uint8Array) => BlockDecrypt)[] = [tea, threeWay, cast128, rc5, rc6, mars, idea, gost];
