/** Bulgarian text of the `npc_shop` window. */

import type en from './en';

export default {
  'shop.title': 'Магазин',
  'shop.repairAll': 'Поправи всичко',
  'shop.repair': 'Поправи',
  'shop.tax': 'Данък при продажба: {rate}%',
  'shop.page': 'Страница {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
