import { observer } from 'mobx-react-lite';

/** Line icons for the command menu (24x24, stroke only), so the tiles need no sprite. */
const PATHS: Record<string, string> = {
  move: 'M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10zM12 8v6M9 11h6',
  inventory: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2M10 13h4',
  character: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7s8 2.600 8 7',
  skills: 'M12 3l2.300 6.200L21 10l-5 4.300L17.500 21 12 17.500 6.500 21 8 14.300 3 10l6.700-.8z',
  friends: 'M9 11a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM2 20c0-3.600 3-6 7-6s7 2.400 7 6M16 4.500a3.500 3.500 0 0 1 0 6.500M18 14c2.400.6 4 2.400 4 5',
  party: 'M12 4a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5zM5 13a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5zM19 13a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5zM11 9l-4.500 4M13 9l4.500 4',
  guild: 'M12 3l8 3v6c0 4.500-3.400 8-8 9-4.600-1-8-4.500-8-9V6zM12 8v7M9 11h6',
  quests: 'M7 3h10v16a2 2 0 0 1-4 0H5v-2a2 2 0 0 1 2-2V3zM10 7h4M10 11h4',
  helper: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  options: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  switch: 'M4 8h13l-3-3M20 16H7l3 3',
  system: 'M12 3v8M6.300 6.300a8 8 0 1 0 11.400 0',
  attack: 'M5 19l10-10M15 9l4-4v4h-4zM19 19L9 9M9 9L5 5v4h4zM4 20l2-2M20 20l-2-2',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  hand: 'M8 12V6.500a1.500 1.500 0 0 1 3 0V11M11 10.500V4.500a1.500 1.500 0 0 1 3 0V11M14 10.500V5.500a1.500 1.500 0 0 1 3 0V12M17 10.500a1.500 1.500 0 0 1 3 0V15c0 4-2.500 6.500-6.500 6.500-3 0-4.500-1.500-6-4L4 13.500a1.500 1.500 0 0 1 2.500-1.500L8 14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  book: 'M4 5c3-1 5.500-1 8 1v14c-2.500-2-5-2-8-1zM20 5c-3-1-5.500-1-8 1v14c2.500-2 5-2 8-1z',
};

export const Icon = observer(({ name, size = 26 }: { name: keyof typeof PATHS; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={PATHS[name]} />
  </svg>
));

export type IconName = keyof typeof PATHS;
