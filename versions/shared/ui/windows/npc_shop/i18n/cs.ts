/** cs text of `versions/shared/ui/windows/npc_shop`. */

import type en from './en';

export default {
  'shop.title': 'Obchod',
  'shop.repairAll': 'Opravit vše',
  'shop.repair': 'Opravit',
  'shop.tax': 'Daň z prodeje: {rate}%',
  'shop.page': 'Stránka {page}',
} satisfies Partial<Record<keyof typeof en, string>>;
