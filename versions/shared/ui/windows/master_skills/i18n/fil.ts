/** fil text of `versions/shared/ui/windows/master_skills`. */

import type en from './en';

export default {
  'master.spendPoint': 'Gugulin ang {points} master point sa {skill}?',
  'master.spendPoints': 'Gugulin ang {points} master point sa {skill}?',
  'master.skillFallback': 'skill {number}',
  'master.majestic': 'Majestic level {level} · puntos {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
