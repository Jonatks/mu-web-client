import { observable } from 'mobx';

/** What the touch HUD has open: the command menu and the skill picker (-1 closed, else the slot it opened on) the stat points panel and the messages panel. */
export const MobileMenu = observable({ open: false, picker: -1, stats: false, chat: false });
