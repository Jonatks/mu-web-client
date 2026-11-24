/** bn text of `versions/shared/ui/windows/npc_shop`. */

import type en from './en';

export default {
  'shop.title': 'দোকান',
  'shop.repairAll': 'সব মেরামত',
  'shop.repair': 'মেরামত',
  'shop.tax': 'বিক্রয় কর: {rate}%',
  'shop.page': 'পৃষ্ঠা {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
