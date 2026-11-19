/** Japanese text of the `master_skills` window. */

import type en from './en';

export default {
  'master.spendPoint': 'マスターポイント {points} を{skill}に使いますか？',
  'master.spendPoints': 'マスターポイント {points} を{skill}に使いますか？',
  'master.skillFallback': 'スキル {number}',
  'master.majestic': 'Majesticレベル {level} · ポイント {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
