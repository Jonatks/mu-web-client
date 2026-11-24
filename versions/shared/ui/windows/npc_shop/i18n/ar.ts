/** ar text of `versions/shared/ui/windows/npc_shop`. */

import type en from './en';

export default {
  'shop.title': 'المتجر',
  'shop.repairAll': 'إصلاح الكل',
  'shop.repair': 'إصلاح',
  'shop.tax': 'ضريبة البيع: {rate}%',
  'shop.page': 'الصفحة {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
