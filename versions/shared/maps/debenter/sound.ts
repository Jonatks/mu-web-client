import type { MapSound, VoiceSet } from '@/controllers/sound';
import { ACHERON_SOUND, voice } from '../acheron/sound';

/** Debenter's monsters: the Season 19 client ships no sounds of their own, so they use their Acheron kin's. */
export const DEBENTER: VoiceSet = {
  239: voice('devilfairy', false),
  240: voice('ebeast'),
  241: voice('eknight'),
  242: voice('salamander', true, true),
  243: voice('undine', true, true),
  244: voice('silpheed', false, true),
  245: voice('gnome', true, true),
  246: voice('hilasha', true, true),
};

/** No bed or music of its own in the Season 19 client either: Acheron's. */
export const DEBENTER_SOUND: MapSound = { ...ACHERON_SOUND, monsterCues: DEBENTER };
