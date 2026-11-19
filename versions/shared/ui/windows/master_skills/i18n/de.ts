/** German text of the `master_skills` window. */

import type en from './en';

export default {
  'master.spendPoint': '{points} Master-Punkt für {skill} ausgeben?',
  'master.spendPoints': '{points} Master-Punkte für {skill} ausgeben?',
  'master.skillFallback': 'Fertigkeit {number}',
  'master.majestic': 'Majestic-Stufe {level} · Punkte {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
