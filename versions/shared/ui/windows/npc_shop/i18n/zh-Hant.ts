/** zh-Hant text of `versions/shared/ui/windows/npc_shop`. */

import type en from './en';

export default {
  'shop.title': '商店',
  'shop.repairAll': '全部修理',
  'shop.repair': '修理',
  'shop.tax': '營業稅：{rate}%',
  'shop.page': '第{page}頁',
} satisfies Partial<Record<keyof typeof en, string>>;
