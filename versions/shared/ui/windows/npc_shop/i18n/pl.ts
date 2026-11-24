/** Polish text of the `npc_shop` window. */

import type en from './en';

export default {
  'shop.title': 'Sklep',
  'shop.repairAll': 'Napraw wszystko',
  'shop.repair': 'Napraw',
  'shop.tax': 'Podatek od sprzedaży: {rate}%',
  'shop.page': 'Strona {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
