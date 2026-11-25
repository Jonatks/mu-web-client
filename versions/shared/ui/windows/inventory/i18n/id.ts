/** id text of `versions/shared/ui/windows/inventory`. */

import type en from './en';

export default {
  'inventory.title': 'Inventaris',
  'inventory.close': 'Tutup (I,V)',
  'inventory.repair': 'Perbaiki (L)',
  'inventory.personalShop': 'Toko Pribadi',
  'inventory.expand': 'Buka Inventaris Tambahan (K)',
  'inventoryExt.title': 'Inventaris tambahan',
} satisfies Partial<Record<keyof typeof en, string>>;
