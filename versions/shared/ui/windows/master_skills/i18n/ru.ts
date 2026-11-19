/** Russian text of the `master_skills` window. */

import type en from './en';

export default {
  'master.spendPoint': 'Потратить {points} master-очко на {skill}?',
  'master.spendPoints': 'Потратить {points} master-очков на {skill}?',
  'master.skillFallback': 'умение {number}',
  'master.majestic': 'Уровень Majestic {level} · очки {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
