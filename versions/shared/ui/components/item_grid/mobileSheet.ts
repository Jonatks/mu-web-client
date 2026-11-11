import { observable } from 'mobx';
import type { Item } from '@/ecs/world';
import type { TextKey } from '@/i18n';
import type { TooltipContext } from '../item_tooltip';

/**
 * Touch only, like Mu Magdalena: a tap on an item opens a centred sheet with its details and a Move button (pick it up to
 * carry it) instead of grabbing it at once; Use is the right click (drink, equip, send to the open storage).
 * The sheet itself is drawn by `hud/mobile_controls/itemSheet.tsx`.
 */
export type SheetEntry = {
  item: Item;
  /** Inventory slot or grid square, for the tooltip (pets ask the server by slot). */
  slot: number;
  context: TooltipContext;
  /** The main action (Move: carry it; Buy in a shop); none for a look-only item. */
  move?: () => void;
  moveLabel?: TextKey;
  use?: () => void;
  useLabel?: TextKey;
};

export const ItemSheet = observable({ entry: null as SheetEntry | null });

export const openItemSheet = (entry: SheetEntry): void => {
  ItemSheet.entry = entry;
};
