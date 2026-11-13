/**
 * Writers for the ancient set files, the reverse of `assets/mu/itemSetFile.ts`:
 * `ItemSetType.bmd` (two set numbers per item code, 4 bytes each) and `ItemSetOption_<lang>.bmd`
 * (110 bytes per set). Both are Bux-keyed per record and may carry a trailing checksum, so every
 * writer patches the raw bytes in place and leaves the rest untouched.
 */

import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';

const TYPE_RECORD = 4;
const OPTION_RECORD = 110;
const NAME_LENGTH = 64;
/** `MAX_ITEM` slots in the type table: 16 groups of 512. */
const MAX_ITEM = 16 * 512;
/** A set number is one byte and 255 means none, so 254 sets is the ceiling. */
export const MAX_SET_NUMBER = 254;

export type SetOptionValue = { readonly option: number; readonly value: number };

export type SetRecord = {
  readonly name: string;
  /** One row per piece past the first (up to 6), two options each. */
  readonly standard?: readonly (readonly SetOptionValue[])[];
  readonly ext?: readonly SetOptionValue[];
  /** Up to 5 options of the full set. */
  readonly full?: readonly SetOptionValue[];
  /** How many items the set has. */
  readonly itemCount?: number;
  /** One flag per class slot (7 bytes). */
  readonly classes?: readonly number[];
};

/** Item code of a group and number, as `ItemSetType.bmd` indexes it. */
export const itemCode = (group: number, number: number): number => group * 512 + number;

/** The two set numbers of an item code (0 or 255 mean none). */
export function itemSetNumbers(bytes: Uint8Array, code: number): [number, number] {
  if (code < 0 || code >= MAX_ITEM) throw new Error(`Item code ${code} is out of range`);
  const record = bytes.slice(code * TYPE_RECORD, code * TYPE_RECORD + TYPE_RECORD);
  convertBux(record, TYPE_RECORD);
  return [record[0], record[1]];
}

/** Puts `setNumber` in the first or second set slot of an item. Returns a new copy. */
export function setItemSetNumber(bytes: Uint8Array, code: number, slot: 0 | 1, setNumber: number): Uint8Array {
  if (code < 0 || code >= MAX_ITEM) throw new Error(`Item code ${code} is out of range`);
  if (setNumber < 0 || setNumber > MAX_SET_NUMBER) throw new Error(`Set number ${setNumber} is out of range`);
  const out = bytes.slice();
  const at = code * TYPE_RECORD;
  const record = out.slice(at, at + TYPE_RECORD);
  convertBux(record, TYPE_RECORD);
  record[slot] = setNumber;
  convertBux(record, TYPE_RECORD);
  out.set(record, at);
  return out;
}

const writeOptions = (record: Uint8Array, at: number, valuesAt: number, list: readonly SetOptionValue[] | undefined, count: number) => {
  for (let i = 0; i < count; i++) {
    record[at + i] = list?.[i]?.option ?? 0xff;
    record[valuesAt + i] = list?.[i]?.value ?? 0xff;
  }
};

/** The 110 plain bytes of a set record (names are one byte per character, as the client reads them), layout as `OPTION_RECORD` in itemSetFile.ts. */
export function encodeSetRecord(set: SetRecord): Uint8Array {
  const record = new Uint8Array(OPTION_RECORD);
  const name = Uint8Array.from(set.name, c => c.charCodeAt(0));
  if (name.length >= NAME_LENGTH) throw new Error(`Set name too long: ${set.name}`);
  record.set(name, 0);
  for (let row = 0; row < 6; row++) writeOptions(record, 64 + row * 2, 76 + row * 2, set.standard?.[row], 2);
  writeOptions(record, 88, 90, set.ext, 2);
  record[92] = set.itemCount ?? 0;
  writeOptions(record, 93, 98, set.full, 5);
  for (let i = 0; i < 7; i++) record[103 + i] = set.classes?.[i] ?? 0;
  return record;
}

const readOptions = (record: Uint8Array, at: number, valuesAt: number, count: number): SetOptionValue[] => {
  const out: SetOptionValue[] = [];
  for (let i = 0; i < count; i++) out.push({ option: record[at + i], value: record[valuesAt + i] });
  return out;
};

/** The reverse of `encodeSetRecord`: the set record in 110 plain bytes. Slots stay in place, so rows keep their gaps. */
export function decodeSetRecord(record: Uint8Array): SetRecord {
  let end = 0;
  while (end < NAME_LENGTH && record[end]) end++;
  const standard: SetOptionValue[][] = [];
  for (let row = 0; row < 6; row++) standard.push(readOptions(record, 64 + row * 2, 76 + row * 2, 2));
  return {
    name: String.fromCharCode(...record.subarray(0, end)),
    standard,
    ext: readOptions(record, 88, 90, 2),
    itemCount: record[92],
    full: readOptions(record, 93, 98, 5),
    classes: Array.from(record.subarray(103, 110)),
  };
}

/** Writes one set record (Bux-keyed) at its set number. The file grows when the number is past its end. */
export function setSetOption(bytes: Uint8Array, setNumber: number, set: SetRecord): Uint8Array {
  if (setNumber < 1 || setNumber > MAX_SET_NUMBER) throw new Error(`Set number ${setNumber} is out of range`);
  const at = setNumber * OPTION_RECORD;
  const tail = bytes.length % OPTION_RECORD;
  const body = Math.floor(bytes.length / OPTION_RECORD) * OPTION_RECORD;
  const end = at + OPTION_RECORD;
  const out = new Uint8Array(Math.max(bytes.length, end + tail));
  out.set(bytes.subarray(0, body));
  if (end > body) out.fill(0xff, body, end);
  out.set(bytes.subarray(body), Math.max(body, end));
  const record = encodeSetRecord(set);
  convertBux(record, OPTION_RECORD);
  out.set(record, at);
  return out;
}
