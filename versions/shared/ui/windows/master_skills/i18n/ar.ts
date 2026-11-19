/** ar text of `versions/shared/ui/windows/master_skills`. */

import type en from './en';

export default {
  'master.spendPoint': 'إنفاق {points} نقطة إتقان على {skill}؟',
  'master.spendPoints': 'إنفاق {points} نقطة إتقان على {skill}؟',
  'master.skillFallback': 'المهارة {number}',
  'master.majestic': 'مستوى Majestic {level} · النقاط {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
