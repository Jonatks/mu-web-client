/** ca text of `versions/shared/ui/windows/inventory`. */

import type en from './en';

export default {
  'inventory.title': 'Inventari',
  'inventory.close': 'Tanca (I,V)',
  'inventory.repair': 'Repara (L)',
  'inventory.personalShop': 'Botiga personal',
  'inventory.expand': 'Obre l\'inventari ampliat (K)',
  'inventoryExt.title': 'Inventari ampliat',
} satisfies Partial<Record<keyof typeof en, string>>;
