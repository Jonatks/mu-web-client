import { reaction } from 'mobx';
import { Ecs } from '@/ecs/current';
import { GameOptions } from '@/controllers/settings';
import { Hero } from '@/modules/hero';
import { serverSetting } from '../servers/serverManifest';
import { findHotkeyItem, UNBOUND_HOTKEY } from './itemHotkeys';
import { Bag } from './state';
import { underThreshold } from './potionThreshold';

/** At most one potion of each kind this often. */
const DRINK_MS = 1000;
/** The Q and W keys, unbound: the biggest health or mana potion in the bag (`GetHotKeyItemIndex`). */
const HEALTH_KEY = 0;
const MANA_KEY = 1;


/**
 * Ours, where the world's `server.json` sets `autoHealthPotion` / `autoManaPotion` and the player's option is on:
 * life or mana under the threshold (Options, 40 % by default as Mu Magdalena) drinks the potion the unbound Q or W key
 * would, through the same request. The original never drinks by itself. Readme: "Automatic potions".
 */
export function installAutoMana(): void {
  const drinker = (key: number, on: () => boolean, current: () => number, max: () => number) => {
    let lastDrink = -Infinity;
    reaction(current, value => {
      if (!on() || !underThreshold(value, max(), GameOptions.autoPotionPercent)) return;
      if (Hero.currentHP <= 0 || !Ecs.world?.playerEntity) return;
      const now = Date.now();
      if (now - lastDrink < DRINK_MS) return;
      const slot = findHotkeyItem(Hero.items, key, UNBOUND_HOTKEY);
      if (slot < 0) return;
      lastDrink = now;
      Bag.consumeItemRequest(slot);
    });
  };
  drinker(HEALTH_KEY, () => GameOptions.autoHealthPotion && serverSetting('autoHealthPotion'), () => Hero.currentHP, () => Hero.maxHP);
  drinker(MANA_KEY, () => GameOptions.autoManaPotion && serverSetting('autoManaPotion'), () => Hero.currentMP, () => Hero.maxMP);
}
