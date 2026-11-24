/** Korean text of the `npc_shop` window. */

import type en from './en';

export default {
  'shop.title': '상점',
  'shop.repairAll': '모두 수리',
  'shop.repair': '수리',
  'shop.tax': '판매 수수료: {rate}%',
  'shop.page': '{page}페이지',
} satisfies Partial<Record<keyof typeof en, string>>;
