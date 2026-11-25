/** Thai text of the `inventory` window. */

import type en from './en';

export default {
  'inventory.title': 'กระเป๋า',
  'inventory.close': 'ปิด (I, V)',
  'inventory.repair': 'ซ่อม (L)',
  'inventory.personalShop': 'ร้านค้าส่วนตัว',
  'inventory.expand': 'เปิดกระเป๋าขยาย (K)',
  'inventoryExt.title': 'ช่องเก็บของเพิ่มเติม',
} satisfies Partial<Record<keyof typeof en, string>>;
