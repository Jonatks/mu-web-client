/** fa text of `versions/shared/ui/windows/master_skills`. */

import type en from './en';

export default {
  'master.spendPoint': '{points} امتیاز استادی برای {skill} خرج شود؟',
  'master.spendPoints': '{points} امتیاز استادی برای {skill} خرج شود؟',
  'master.skillFallback': 'مهارت {number}',
  'master.majestic': 'سطح Majestic {level} · امتیاز {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
