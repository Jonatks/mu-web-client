/** hu text of `versions/shared/ui/windows/inventory`. */

import type en from './en';

export default {
  'inventory.title': 'Leltár',
  'inventory.close': 'Bezárás (I,V)',
  'inventory.repair': 'Javítás (L)',
  'inventory.personalShop': 'Saját bolt',
  'inventory.expand': 'Bővített leltár megnyitása (K)',
  'inventoryExt.title': 'Bővített felszerelés',
} satisfies Partial<Record<keyof typeof en, string>>;
