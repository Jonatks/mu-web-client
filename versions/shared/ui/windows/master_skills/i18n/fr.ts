/** French text of the `master_skills` window. */

import type en from './en';

export default {
  'master.spendPoint': 'Dépenser {points} point de master sur {skill} ?',
  'master.spendPoints': 'Dépenser {points} points de master sur {skill} ?',
  'master.skillFallback': 'compétence {number}',
  'master.majestic': 'Niveau Majestic {level} · points {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
