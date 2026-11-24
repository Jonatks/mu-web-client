/** Russian text of the `npc_shop` window. */

import type en from './en';

export default {
  'shop.title': 'Магазин',
  'shop.repairAll': 'Починить всё',
  'shop.repair': 'Починить',
  'shop.tax': 'Налог с продажи: {rate}%',
  'shop.page': 'Страница {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
