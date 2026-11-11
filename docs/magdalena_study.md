# Mu Magdalena study (mobile, landscape 915x412 CSS px) and what was taken

Source: a play session on `play.mumagdalenas.com` with a test account (touch emulation, Pixel 7 landscape), captures kept outside the repo
(they show another game's art). Numbers are CSS px at 915x412 unless said otherwise.

## What Mu Magdalena does
- **World screen is almost free.** Top left: level badge, name, zone with coordinates, NORMAL pill, pet / exp row. Top right: round
  buttons (quick potion with a "99+" count, HELPER, shop, a hamburger menu). Bottom left: joystick with an ornate ring and the word MOVE.
  Bottom centre: one slim bar with the life orb (red, number inside), six small skill boxes, the mana orb (blue), AG and SD as thin bars
  over the boxes and experience as a hairline under them. Bottom right: a round attack button and a book button for the skills window.
  A "SAFE ZONE" pill. A chat bubble with an unread counter instead of a chat log. Announcements as big gold text at the top centre.
- **Talk pill** (about 211x38): appears next to an NPC, dark rounded, "Talk . <NPC name>".
- **Names over players** are rounded translucent pills with a country flag and the clan tag.
- **Command menu** (hamburger): a near full-screen panel of square tiles with an icon and a word (Move, Inventory, Character, Guild, MU Helper,
  Settings, Change character, ...), a close X, a footer with players online.
- **Windows**: the inventory, vault and shops are the ORIGINAL MU windows (same frame, equipment dolls, bag), docked on the right, two side by side.
- **Item tap** opens a centred sheet with the whole tooltip and a "Move" button, so an item is never picked up by accident. Then tap where it goes.
- **Skills window**: "1 - select the position" (six boxes) and "2 - select the skill" (grid of every skill, locked ones greyed, a Clear tile),
  a MANUAL / AUTO attack toggle, a close X.
- **MU Helper**: tabs Combat / Pickup, a rotation of attacks, buffs "only when missing", attack and loot range, original position,
  potions with HP / Mana / SD thresholds (10% to 100%) and a big green Start Helper button.
- **Settings**: tabs Interface / Game, sliders for game font (190%), interface font (190%), pad size (100%), toggle show movement pad.
- **Character screen**: the focused character is shown large; a card at the bottom with name, class and level, dots, big round arrows,
  pills Enter / Create / Delete; a menu button top left and a sound button top right.
- **Not taken on purpose**: the shop / top-up flows (payments), the "Buy" button, country flags.

## What was taken (all touch only; the mouse client is unchanged)
| Magdalena | Here |
|---|---|
| slim bottom bar, orbs, six boxes, AG / SD / exp | `hud/mobile_controls` `Bar` (the original bar hides itself on touch) |
| status top left | `StatusPanel`: level, name, zone with coordinates, SAFE ZONE pill |
| round Helper and menu buttons | `TopButtons` (Helper tap starts / stops, long press opens its settings) |
| command menu with tiles | `CommandMenu`: Move, Inventory, Character, Skills, Friends, Party, Guild, Quests, MU Helper, Settings, Change character, System |
| attack button | `AttackButton`: nearest monster within 8 tiles, again to let go |
| talk pill | `TalkButton` |
| skills window | `SkillPicker` (six positions, grid, Clear, close X) |
| item sheet with Move | `ItemSheetView` + `item_grid/mobileSheet.ts`; inventory, equipment and every shared grid (vault, trade, shops) |
| name pills | `hud/name_tags/style.less` (rounded, larger) |
| character screen | `pages/character_select/MobilePanel.tsx` (zooms on the focused character) |
| no potion button | NOT taken: potions are the Helper's job (its HP / Mana thresholds) |
| removed from touch | the original bar and its five buttons, event timers, the Start / Settings Helper buttons, the warp button |

## Not done yet
Chat bubble with an unread counter, a Pickup tab on the Helper tuned for touch, the MANUAL / AUTO toggle, a settings window with a pad-size
slider (the pad size is already in Options > Controls), country flags, the shop window as a sheet. Real-phone checks with Chrome and Samsung Internet.
