/** uk text of `versions/shared/ui/windows/inventory`. */

import type en from './en';

export default {
  'inventory.title': 'Інвентар',
  'inventory.close': 'Закрити (I,V)',
  'inventory.repair': 'Полагодити (L)',
  'inventory.personalShop': 'Особиста крамниця',
  'inventory.expand': 'Відкрити розширений інвентар (K)',
  'inventoryExt.title': 'Розширений інвентар',
} satisfies Partial<Record<keyof typeof en, string>>;
