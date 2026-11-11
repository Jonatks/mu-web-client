import { observable } from 'mobx';

/** What the touch HUD has open: the command menu and the skill picker (-1 closed, else the slot it opened on) the stat points panel the messages panel and the attack mode (auto keeps picking the next monster) the settings panel and whether the cast button is holding a fight and whether the pick-up hand is sweeping the drops around. */
export const MobileMenu = observable({ open: false, picker: -1, stats: false, chat: false, auto: false, settings: false, firing: false, picking: false });
