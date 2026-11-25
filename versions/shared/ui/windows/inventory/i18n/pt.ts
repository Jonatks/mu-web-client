/** Portuguese text of the `inventory` window. */

import type en from './en';

export default {
  'inventory.title': 'Inventário',
  'inventory.close': 'Fechar (I,V)',
  'inventory.repair': 'Reparar (L)',
  'inventory.personalShop': 'Loja pessoal',
  'inventory.expand': 'Abrir o inventário estendido (K)',
  'inventoryExt.title': 'Inventário expandido',
} satisfies Partial<Record<keyof typeof en, string>>;
