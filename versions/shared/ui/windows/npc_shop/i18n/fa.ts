/** fa text of `versions/shared/ui/windows/npc_shop`. */

import type en from './en';

export default {
  'shop.title': 'فروشگاه',
  'shop.repairAll': 'تعمیر همه',
  'shop.repair': 'تعمیر',
  'shop.tax': 'مالیات فروش: {rate}%',
  'shop.page': 'صفحه {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
