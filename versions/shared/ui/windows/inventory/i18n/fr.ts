/** French text of the `inventory` window. */

import type en from './en';

export default {
  'inventory.title': 'Inventaire',
  'inventory.close': 'Fermer (I,V)',
  'inventory.repair': 'Réparer (L)',
  'inventory.personalShop': 'Boutique personnelle',
  'inventory.expand': 'Ouvrir l’inventaire étendu (K)',
  'inventoryExt.title': 'Inventaire étendu',
} satisfies Partial<Record<keyof typeof en, string>>;
