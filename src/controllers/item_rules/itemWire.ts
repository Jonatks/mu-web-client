import type { Item } from '../../ecs/world';
import { gameVersion } from '@/version';
import { ItemSerializer } from './itemSerializer';

/**
 * Items as the game server sends them: the classic 12 bytes, or OpenMU's extended layout for client
 * 106.3 (`ItemSerializerExtended`, 5 to 15 bytes, packed back to back in lists). An extended item is
 * rewritten as the classic 12 bytes OpenMU would have sent, so `raw` and every reader stay as they are.
 */
const OPTION = 0x01, LUCK = 0x02, SKILL = 0x04, EXCELLENT = 0x08, ANCIENT = 0x10, HARMONY = 0x20, GUARDIAN = 0x40, SOCKETS = 0x80;

const extended = () => gameVersion?.protocol.itemFormat === 'extended';

/** Bytes the item at `at` takes on the wire. */
export function wireItemLength(bytes: Uint8Array, at = 0): number {
  if (!extended()) return ItemSerializer.NeededSpace;
  const f = bytes[at + 4] ?? 0;
  let n = 5;
  for (const flag of [OPTION, EXCELLENT, ANCIENT, HARMONY]) if (f & flag) n++;
  if (f & SOCKETS) n += 1 + (bytes[at + n] & 0x0f);
  return n;
}

/** The classic 12 bytes of an extended item (OpenMU `ItemSerializer.SerializeItem` for the same item). */
export function extendedToClassic(b: Uint8Array): { bytes: Uint8Array; optionLevel: number } {
  const f = b[4];
  const num = ((b[0] & 0x0f) << 8) | b[1];
  const c = new Uint8Array(ItemSerializer.NeededSpace);
  let i = 5;
  const opt = f & OPTION ? b[i++] : 0;
  const exc = f & EXCELLENT ? b[i++] : 0;
  const anc = f & ANCIENT ? b[i++] : 0;
  const harmony = f & HARMONY ? b[i++] : 0;
  const optionLevel = opt & 0x0f, optionType = opt >> 4;
  c[0] = num & 0xff;
  c[1] = ((b[2] << 3) & 0x78) | (f & SKILL ? 0x80 : 0) | (f & LUCK ? 0x04 : 0) | (optionLevel & 3);
  c[2] = b[3];
  c[3] = ((optionLevel & 4) << 4) | ((optionType & 3) << 4) | exc | (num & 0x100 ? 0x80 : 0);
  c[4] = f & ANCIENT ? (anc & 0x03) | (((anc >> 4) << 2) & 0x0c) : 0;
  c[5] = ((b[0] >> 4) << 4) | (f & GUARDIAN ? 0x08 : 0);
  c[6] = harmony;
  c.fill(0xff, 7);
  if (f & SOCKETS) {
    const bonus = b[i] >> 4, count = b[i] & 0x0f;
    c[6] |= bonus === 0x0f ? 0xff : bonus;
    for (let s = 0; s < count && s < 5; s++) c[7 + s] = b[i + 1 + s];
  }
  return { bytes: c, optionLevel };
}

/** One item read off the wire. */
export function readWireItem(bytes: Uint8Array): Item {
  if (!extended()) return ItemSerializer.DeserializeItem(bytes);
  const { bytes: classic, optionLevel } = extendedToClassic(bytes);
  const item = ItemSerializer.DeserializeItem(classic);
  // The extended layout keeps option levels past the classic 7.
  if (optionLevel > 7) item.optionLevel = optionLevel;
  return item;
}

/**
 * A list of `count` entries from `start`: `prefix` bytes, the item, then `suffix` bytes each. Gives
 * where each entry starts (its prefix fields are read from there) and its item.
 */
export function readWireItems(view: DataView, start: number, count: number, prefix: number, suffix = 0): { at: number; item: Item }[] {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const out: { at: number; item: Item }[] = [];
  for (let k = 0, at = start; k < count && at + prefix < bytes.length; k++) {
    const len = wireItemLength(bytes, at + prefix);
    out.push({ at, item: readWireItem(bytes.subarray(at + prefix, at + prefix + len)) });
    at += prefix + len + suffix;
  }
  return out;
}
