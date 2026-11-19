/** sr-Latn text of `versions/shared/ui/windows/master_skills`. */

import type en from './en';

export default {
  'master.spendPoint': 'Uložiti Master poene ({points}) u veštinu {skill}?',
  'master.spendPoints': 'Uložiti Master poene ({points}) u veštinu {skill}?',
  'master.skillFallback': 'br. {number}',
  'master.majestic': 'Majestic nivo {level} · poeni {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
