/** Romanian text of the `inventory` window. */

import type en from './en';

export default {
  'inventory.title': 'Inventar',
  'inventory.close': 'Închide (I,V)',
  'inventory.repair': 'Repară (L)',
  'inventory.personalShop': 'Magazin personal',
  'inventory.expand': 'Deschide inventarul extins (K)',
  'inventoryExt.title': 'Inventar extins',
} satisfies Partial<Record<keyof typeof en, string>>;
