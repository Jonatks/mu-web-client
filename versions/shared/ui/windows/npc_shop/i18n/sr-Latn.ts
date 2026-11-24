/** sr-Latn text of `versions/shared/ui/windows/npc_shop`. */

import type en from './en';

export default {
  'shop.title': 'Prodavnica',
  'shop.repairAll': 'Popravi sve',
  'shop.repair': 'Popravi',
  'shop.tax': 'Porez na promet: {rate}%',
  'shop.page': 'Strana {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
