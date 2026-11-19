/** Thai text of the `master_skills` window. */

import type en from './en';

export default {
  'master.spendPoint': 'ใช้แต้มมาสเตอร์ {points} แต้มกับ {skill} ไหม',
  'master.spendPoints': 'ใช้แต้มมาสเตอร์ {points} แต้มกับ {skill} ไหม',
  'master.skillFallback': 'สกิล {number}',
  'master.majestic': 'เลเวล Majestic {level} · แต้ม {points}',
} satisfies Partial<Record<keyof typeof en, string>>;
