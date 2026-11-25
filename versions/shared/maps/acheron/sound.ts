import { MonsterActionType } from '@versions/shared/objects/enum';
import type { MapSound, MonsterCue, VoiceSet } from '@/controllers/sound';
import type { Sounds } from '@/controllers/sound/recipes';

const A = MonsterActionType;

/**
 * Acheron's monsters, keyed by model type like Karutan's set: the Season 19 client's `Sound/Akeron/<name>_*` files.
 * There is no source to say when each plays; this follows Karutan's shape (steps on frames 1-2 and 7-8, attack on
 * both attacks, `skill1` on the second where the monster has one, hit on Shock, death on Die).
 */
const voice = (name: string, move = true, skill = false): readonly MonsterCue[] => {
  const s = (k: string) => `Sound/Akeron/${name}_${k}` as Sounds;
  return [
    ...(move ? [{ on: [A.Walk], play: s('move1'), frame: [1, 2] as const }, { on: [A.Walk], play: s('move2'), frame: [7, 8] as const }] : []),
    { on: skill ? [A.Attack1] : [A.Attack1, A.Attack2], play: s('attack1') },
    ...(skill ? [{ on: [A.Attack2], play: s('skill1') }] : []),
    { on: [A.Shock], play: s('hit1') },
    { on: [A.Die], play: s('death1') },
  ];
};

export const ACHERON: VoiceSet = {
  217: voice('devilfairy', false),
  218: voice('ebeast'),
  219: voice('eknight'),
  220: voice('ubaiddevilfairy'),
  221: voice('uebeast'),
  222: voice('ubaideknight'),
  223: voice('undine', true, true),
  224: voice('salamander', true, true),
  225: voice('silpheed', false, true),
  226: voice('gnome', true, true),
  227: voice('hilasha', true, true),
};

/** Acheron's sound (`MapLayer.sound`): the Season 19 client's own files, `Sound/Akeron/` and `Music/Acheron`. */
export const ACHERON_SOUND: MapSound = {
  beds: [{ sound: 'Sound/Akeron/Amb_Acheron', volume: 0.4 }],
  music: 'Music/Acheron',
  monsterCues: ACHERON,
};
