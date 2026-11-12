# Mu Magdalena study (mobile, landscape 915x412 CSS px)

Source: two play sessions on `play.mumagdalenas.com` with the owner's test account (touch emulation, Pixel 7 landscape). Screenshots and DOM dumps
(element sizes, fonts, colours) were kept outside the repo because they show another game's art. Numbers below are CSS px at 915x412.
Not studied because they are payment or server specific: the top-up flows (a "Top up by card" dialog pops up by itself), the "Buy" button,
the cash shop, the reset ranking. Party requests were declined.

## 1. Screens in the order a player meets them
**Login** (before the game): form with user and password, a language choice, a loading bar; the game files download first (about 377 MB).

**Character screen.** The focused character is large in the centre of a dark scene (the camera zooms in on it). Bottom card (about 555 wide,
centred, rounded 14, gold 2 px border): name in a serif face with letter spacing, then "Class . Lv N", a row of dots (one per character, the active
one a longer gold pill), and pills Enter (gold, filled), Create (dark), Delete (dark red). Round arrows 52 px left and right of the card flip through
characters. A round sound button top right. A black speech-bubble style strip top left shows server messages.
**Create a new hero**: a big bust portrait of the chosen class above a card with the title and seven class pills (Dark Wizard, Dark Knight, Elf,
Magic Gladiator, Dark Lord, Summoner, Rage Fighter), a name field, Create (gold) and Cancel.

**World HUD** (DOM over the 3D, everything round or pill shaped, text 9 to 14 px):
- Top left, 250 wide: row 1 a level badge (50x20, 9.5 px, with an experience ring around it), the name (13 px) and a small gold "Buy" button;
  row 2 zone name with coordinates (10 px) and a green NORMAL pill (70x17, 11 px); row 3 the pet bar: name (8.5 px, violet) and a mini bar with its value.
- Top right: four round buttons 48x48 with 8 px between them: quick potion with a "99+" badge, HELPER (label under it), the shop "M", the menu (hamburger).
- Bottom left: the pad, ring 134x134 with an ornate skull frame, a knob of 55, the word "Move" (9 px) under it; "precision" mode is a setting.
- Bottom centre: a slim bar drawn in canvas: red orb (life, number inside) left, mana orb (blue) right, six small boxes between, AG and SD as thin bars
  above them with their numbers, experience as a hairline at the very bottom with the level number at its right end.
- Bottom right: a round skill button 50x50 showing the current skill's icon (the fist for the basic attack) at y 270; a round book button 50x50 at y 350 that opens
  the skills window. A "SAFE ZONE" pill appears just above it while on a safe tile.
- Chat: a 32x32 round bubble above the bar (centre) with a red counter of unread lines. The log is not on the screen: a tap opens a translucent
  "MESSAGES" panel (about 595x130) with the lines in large blue text, an input "Write a message" and a close x.
- Talk pill, 211x38 (width follows the name), 14 px, radius full, 1 px gold border, "Talk . <NPC>", centred above the bar; it changes to the nearest NPC.
- Server announcements: big gold text (20 px) in a 595x56 translucent band at the top centre; one band per message, stacked.
- Players: names as rounded translucent pills with a flag and the clan tag; clan colours differ. NPC names are plain.
- Monsters: the name above each one with a red life bar (about 98 px wide) over it, always visible in view; the target has an orange ring on the ground.
  Damage numbers: white for a miss ("Miss"), red and bold for damage taken, floating up.

**Command menu** (hamburger): a panel 780x386 at (68,13), ridge border 3 px, Georgia; heading "Commands" 23 px with a close x (34 px round);
a 6 column grid of tiles 116x123 (gap 9): Move, Inventory, Allocate points, Ranking, Guild Clan, MU Helper, Settings, Change character, Sign out. Tile: a line
icon above a 15 px label. Footer: "Users online: N" and two round social links.
- **Move**: a full screen overlay (rgba 8,8,12,.82), title "Teleport" 15 px letter spaced, two tabs "World I" / "World II" (212x38), then rows 430x39 radius 12:
  map name left (14 px), "Lv.N . 2,000 Zen" right (11 px, muted gold), a scroll list, a Close pill 113x35. Maps: Arena, Lorencia, Noria, Elveland (their hub), Devias 1-4,
  Dungeon 1-3, Atlans 1-3, Lost Tower 1-7, Tarkan, ... each with its level and Zen cost.
- **Allocate points**: a panel 420x388 (radius 16): title 22 px, "Name . Level N", close x, "Available points N", a Master Skills button (round "M" medallion, master level and points),
  Change character, then STR / AGI / STA / ENG rows: label gold 16 px, value white 20 px, and a minus and a plus button 46x44 radius 10; a HP and Mana line at the bottom.
- **Ranking**: reset ranking with Day / Week / Month / All and the character's profile (server specific; not taken).
- **Guild Clan**: "You are not in a guild. Talk to the Guild Master in Devias to create one."
- **Settings**: panel 520x360 (radius 16), tabs Interface / Game. Interface: Game font (190%), Interface font (190%), Pad size (100%), Show movement pad (switch),
  Precision pad (Active), Camera zoom (1.25x), Reset settings. Game: Full effects (switch), Effect limitation (slider, +13), Music ON/OFF, Sound ON/OFF,
  Hide chat with windows, Configure skills, Show ground items.
- **MU Helper**: tabs Combat / Pickup, a rotation of attacks (a grid of skill icons with a + to add), buffs "only when missing", attack and loot range (1 to 9),
  original position (switch), potions HP / Mana / SD with a switch and a threshold 10% to 100%, a big green Start Helper button, state pill (STOPPED), help (?), close x.
- **Skills**: panel 858x342: left "1 - Select the position" (six slots), right "2 - Select the skill" a 7 column grid of 61x58 tiles with a Clear tile first, locked skills
  greyed; a MANUAL / AUTO attack toggle bottom left; the hint "Tap a skill to place it in the selected slot." The picked slot shows its number.

**Windows.** Inventory, vault, shops and the character window are the ORIGINAL MU windows (same frame art, equipment dolls, an 8 column bag) docked to the right edge
and ending at the screen bottom (the bar sits behind), two side by side. Their close x is at the top right.
**Item tap**: a sheet centred on the screen with the full tooltip and a gold "Mover" button. Then a tap on a cell puts it there.
**Taking things**: tap a ground name or the item to walk to it and pick it up; "Show ground items" decides if names are drawn.
**NPC**: the Talk pill walks to the NPC and opens its window (a shop is the original shop window).

## 2. Style tokens
Dark brown panels (rgba 14,11,8,.9 to 28,21,13), gold borders (217,180,90), text cream (242,230,196), heading gold (255,228,163), serif (Georgia) for titles and the
menu, a sans face for HUD numbers; radii 10 to 16 on panels, full on pills and round buttons; shadows 0 3 10 black .55.

## 3. What was taken (all touch only; the mouse client is unchanged)
| Magdalena | Here |
|---|---|
| slim bottom bar, orbs, six boxes, AG / SD / exp | `hud/mobile_controls` `Bar` (the original bar hides itself on touch) |
| status top left | `StatusPanel` |
| round Helper and menu buttons | `TopButtons` (Helper tap starts / stops, long press opens its settings) |
| command menu | `CommandMenu` (our tiles: Move, Inventory, Character, Skills, Friends, Party, Guild, Quests, MU Helper, Settings, Change character, System) |
| attack button | `AttackButton` (nearest monster within 8 tiles) |
| talk pill | `TalkButton` |
| skills window | `SkillPicker` |
| item sheet with Move | `ItemSheetView` + `item_grid/mobileSheet.ts` |
| name pills | `hud/name_tags/style.less`, drop names `world_label/style.less` |
| character screen | `pages/character_select/MobilePanel.tsx` (zooms on the focused character) |
| Teleport list | `TeleportModal` (this study's second round) |
| Allocate points | `StatsModal` (this study's second round) |
| chat bubble and panel | `ChatBubble` (this study's second round) |
| quick potion button | NOT taken: potions are the Helper's job and the mana potion is automatic |

## 4. Second pass (all of the above plus what was missing)
Added after the second study: monster name and red life bar over the nearest five monsters (a fixed pool moved on the DOM, no React render per frame),
the skill on the big attack button and a book button for the skills window, a MANUAL / AUTO attack mode (AUTO picks the next monster by itself),
the experience ring on the level badge, a Settings panel (interface size, pad size and visibility, music and sound volumes, ground names, auto mana
potion and quiver, and a button to the full Options window), the Map tile, a hero creation card for touch (class pills, name, 3D preview), a long press on a
player (the right click) that opens the original quick menu, Buy in shops (the sheet shows the tooltip with the price first) and Sell for an item in the bag with a
shop open, notices as translucent bands, and visual polish: the joystick is now a translucent dark glass ring with a worn-gold edge, a crest, four arrows,
a MOVE label and it brightens while held; orbs with glass highlights; the bar sits on a dark plate; skill boxes with a top gloss; round buttons with an inner trim.

## 5. Still not taken
Ranking by resets, shop top-up, "Buy", country flags, the Pickup tab of the Helper tuned for touch (the original Helper window still opens from the menu).

## 6. Third pass: how a character fights (found after the owner played the build)
Mistake found in the second build: the cast button only picked the monster, so the plain swing (the fist) took over, and a skill was asked for once and then dropped
because the touch screen never "holds" a button. The original repeats the current skill while the right button is held (`skillCastSystem`: "the repeat belongs to the
held button"). Fixed with a touch stand-in, `World.touchCastHeld`, driven by `hud/mobile_controls/fireControl.ts`:
- The big round button shows the CURRENT skill. One press picks the nearest monster and keeps casting that skill on it (walks into range, repeats on every delay) until the
  monster dies or the button is pressed again; with no attack skill in hand it is the plain swing. AUTO keeps picking the next monster.
- A tap on a skill box selects that skill; an attack skill starts the fight, a buff / heal / summon / teleport is cast on the spot.
- A character starts with its first attack skill selected (`HeroSkills.setSkillList`: the original starts on the first skill of the list, `Hero->CurrentSkill = 0`),
  so a new Dark Wizard has Energy Ball in hand, on slot 1 of the bar and on the cast button. A fist tile in the skills window selects the plain attack on purpose.
- The server decides which skills a new character knows: OpenMU gives Energy Ball to a created Dark Wizard (checked on a fresh character: it enters with Energy Ball). The
  other classes get only castle-siege skills or none until an orb or book is learned, so a new Dark Knight or Elf has only the plain attack until then.
Mu Magdalena, new Dark Wizard (observed): slot 1 holds the FIST, only the fist and Energy Ball are lit in the skills grid (every other skill shown greyed and locked),
and the player taps Energy Ball to place it. Magdalena shows the whole class list greyed; this client lists only what is learned.

## 7. A fight in Mu Magdalena, observed with a real character (Elveland (100,55), mobs adjacent)
- **Monsters**: each one carries its name and a red life bar (about 98 px wide) all the time; they attack the hero by themselves, so the HP orb drops while you
  decide. Damage numbers float up: white "Miss", red for damage taken.
- **Attack**: the round button at the bottom right (50x50, y 270) shows the current skill: the fist (basic attack) or the skill placed on slot 1. One tap attacks the nearest
  monster and keeps going; the button changes its icon when another skill is chosen in the Skills window (tap the position, tap the skill, close). With the fist
  selected the character punches ("Miss" rows) and kills slowly; with a spell selected the kill is far faster. The round book button under it opens the Skills window.
- **Death**: the monster falls, its name and bar go; the experience bar and the level badge ring move.
- **Drops**: the item lands near the monster and its name appears on the ground in a dark translucent pill ("Blood Bone +1"), white text, small; no tooltip.
- **Pick up**: while something lies within reach a round HAND button appears at the top, left of the quick potion; one tap picks it up and both the label and the hand
  disappear. No walking to a tiny item and no tapping its label.
- **Not seen but expected**: experience gain text, the same sweep with several items.
Taken: the pick-up hand (`hud/mobile_controls/topButtons.tsx`, the original's own `AutoGetItem` underneath, the Space key), kept sweeping while something is within reach.

## 8. Verified on a normal account (no GM), local OpenMU, phone emulation
- `test6Dk` (level 61, normal account) walked out of the Lorencia south gate and pressed the cast button: it picked a Bull Fighter, hit it (17 attack packets), the monster's
  bar went 100% to 0%, it died, its drop appeared as "Devil Eye +1", the pick-up hand appeared at the top, one tap picked it up and both the label and the hand went away.
- A brand new level 1 Dark Wizard (`cdwtest`, created with the touch creation card) enters with Energy Ball on slot 1 and on the cast button; it dies to a Bull Fighter or a
  Skeleton in a few seconds, as a level 1 character does in the original, so the first levels are on weaker monsters. The cast packet itself was seen only with a GM.
- Lorencia from the terrain file: the town is walled; the only exits are the two bridge corridors at x 131-134 (north y 147-165, south y 90-105). The east wall is x 153.

## 9. West exit of Lorencia, new Dark Wizard (Mu Magdalena, 2026-11-12)
- Exit: the west bridge (x 94-119, y 126-129); a Shadow Phantom Soldier and a Guard stand at the far end. Talking to the soldier opens the ORIGINAL NPC dialog docked on
  the right with numbered choices ("1. Receive damage and defense increase", "2. Accept a quest"); choosing 1 gives a buff whose icon appears at the top of the screen.
- Monsters there are Elite Bull Fighters (strong for level 1): a level 1 Dark Wizard with the buff died in a few seconds and came back in the town (Lorencia 139,118),
  HP full, Zen kept. No spiders or red dragons were in view at this hour.
- Targeting: an orange ring with a small crosshair lies on the ground under the monster being attacked; "Miss" and red numbers float over it.
- Drops: an item lies on the ground with its name over it (gold "Devil's Key +1"); Zen lies as a small pile of gold coins with a "Zen 149" pill under it. Tapping the pill
  walks the hero to it and picks it up; the money goes straight to the Zen line of the inventory (530 after).
- Inventory: the original window, full height on the right. A tap on an item opens a centred dark panel (about 455x365) with the item picture at the top, the whole
  tooltip in the middle and two gold buttons at the bottom: "Usar" and "Mover". Mover lifts the item; the next tap on a cell puts it there.
- Shops: talking to Pasi the Mage opens the original Merchant window to the left of the inventory, both full height. Occupied shop cells are teal as in the original.
  A tap on a shop item shows its tooltip with the purchasing price ("Purchasing price: 2,694,300"), red lines for what the hero lacks.
- Taken from this pass: the item sheet as a framed panel with the picture, Use and Move (`hud/mobile_controls/itemSheet.tsx`).
- Not taken: Magdalena's inventory and merchant windows are drawn about 1.4x larger than the original's width (cells about 29 px). Here they keep the original size that
  fits the height (cells about 18 px), which is smaller for a thumb. Worth doing next, it needs the window frame redrawn taller than 429 units.

## 10. Resources: Mu Magdalena against this client (2026-11-12)
Same machine and browser for both (Chromium with a software GPU, phone landscape 915x412 at 1x; the GPU makes the frame rates far lower than on a phone,
so they only compare the two). Mu Magdalena in its real world; this client against the local OpenMU (normal account `test6`, Lorencia).

| | Mu Magdalena | this client before | this client after (phone profile v3) |
|---|---|---|---|
| downloaded before the login | 563 MB (it downloads everything first) | about 5 MB (assets on demand) | same |
| requests in the world | 257 | about 1150 | same |
| JS heap in the world | 19 MB | about 290 MB (offline Lorencia) | 193 MB |
| DOM nodes in the world | 20 531 | about 830 | same |
| frames per second, login screen | 29 | 0.6 | 2.8 |
| frames per second, world | 22 | 1.3 (offline Lorencia) | 8.8 |

What the frame rate depends on here (offline Lorencia, frames per second): every Image and Quality effect on 1.3; post-processing, shadows, dynamic lights, MSAA,
sun shafts, bloom and glow off 4.3; plus classic lighting and materials 5.1; plus grass at 2 of 9: 8.1; with no grass at all 10.2. Grass is the biggest cost.
Phone profile v3 takes those values (post-processing, shadows, lights, MSAA, sun shafts, bloom, glow, FXAA and sharpening off, classic lighting and
materials, grass 2); all of it can be turned back on in Options. Still heavier than Mu Magdalena: its scene is lighter and its JS heap far smaller. Next steps:
lower the render resolution on a phone, cull the login scene, and look at the heap (models and textures kept in JS memory).

## 11. What Mu Magdalena is made of (probe, 2026-11-12)
- It is the C++ client compiled to WebAssembly (Emscripten: a global `Module`, about 510 MB of `.data.bin` packages downloaded before playing, 0.2 MB of JavaScript).
  Its canvas is drawn at the page's own size (915x411 at a device ratio of 1) with WebGL 2, no antialiasing. That is why its JS heap is 19 MB.
- Counting WebGL calls from the page gives no fair comparison: Magdalena showed 50 draws and 9.4k triangles per frame, which cannot be the whole crowded world, so its 3D is
  drawn somewhere the page hook does not see (probably an offscreen canvas in a worker); this client showed 17 draws and 24k triangles per animation frame but renders at far
  fewer frames than animation callbacks. Do not use those counts. What is comparable is the frames per second on the same machine (section 10).
- Rewriting this client in C++ / WebAssembly is possible but not recommended: it would discard the ported game and the touch interface, the C++ source of the original client is
  Webzen's, and the gain is in memory and logic, not in GPU drawing, which goes through WebGL either way.
- Plan for performance without changing the look: (1) measure frame time per system inside this client (terrain, objects, characters, effects, post-processing) with the engine's own
  instrumentation; (2) instance repeated objects and grass; (3) compress textures (KTX2); (4) free models and textures kept in JS memory; (5) only then touch quality options, and
  only to values that look the same on a phone-size screen.

## 12. A1: how each class is born in Mu Magdalena (new level 1 characters, 2026-11-12)
Method: create a character of the class, enter, open the Skills window and read which tiles are lit and which are greyed.
- All classes: slot 1 of the six boxes holds the FIST (plain attack) at birth and the other five are empty; nothing is auto-placed. The player places skills.
- **Dark Wizard** (ClauDW, Grand Master line): starts in Lorencia (147,120); lit: fist and Energy Ball only; 22 more tiles greyed.
- **Dark Knight** (ClauDK, Blade Master line): starts in Lorencia (140,118); lit: fist plus 7 skills (a purple blade, a fire burst, a blue lunge with a sword, a dagger strike,
  a red shield, a blue lightning) and a further one lit; 1 greyed. The server gives a new Dark Knight its basic sword skills at once (OpenMU gives none).
- **Elf** (ClauElf, High Elf line): starts in Noria (172,112); the HUD shows the arrow counter ("Arrows 255 (0)") under the name; lit: fist plus 6 skills (a golden figure,
  red arrows, a blue figure, two blue arrow bursts); 11 greyed.
- **Magic Gladiator** (ClauMG, Dual Master line): starts in Lorencia (139,120); lit: fist plus 5 skills; 16 greyed.
- **Rage Fighter** (ClauDL by mistake of the class pill, shows Fist Master): starts in Lorencia (135,118), HUD like the others; skill window (book at the bottom right, (879,372)): fist plus 4 lit skills (a white-blue burst, a slash, a fire burst, a blue vortex) and 4 greyed. The window is a full-width panel with the six boxes on the left (2 rows x 3) and the skill tiles on the right, 'Clear' first, a MANUAL/auto toggle at the bottom and the hint 'Tap a skill to place it in the selected slot'.
- **Dark Lord** (ClauDLo): starts in Lorencia (149,120); lit: fist plus 7 skills (all bird/pet-style icons: a bird head, a blue slash, three purple birds and a rider); 6 greyed. The Skills window has a centred title bar 'SKILLS' and a round X at the top right.
- Creation card pills (x at y=338): Dark Wizard 198, Dark Knight 286, Elf 368, Magic Gladiator 460, Dark Lord 549, Summoner 627, Rage Fighter 716.
- The 'Character deleted' dialog has its Accept button at (458,243); after Accept the list may focus another character, so read the name before each Delete.
- **Summoner** (ClauSu): starts in Elveland (53,224) (not Lorencia); lit: only the fist; all 18 other tiles greyed. So "all skills unlocked" is the class's learnable list by level, not a gift of every skill: Dark Wizard 1 lit of 24, Summoner 0 lit of 18 at level 1, while DK, Elf, MG, DL and RF start with 5 to 8.
Consequence for this client: a new Dark Knight and Elf on this server have no skill, so the cast button only punches. Either the server gives the starting skills (plugin, plan F4)
or the client lists them as locked until learned.

## 13. Draw cost of this client in Lorencia (offline, phone profile, 915x412, software GPU, 2026-11-12)
15 s sample: 784 frames (about 52 fps), 16 draw calls, 23.8k triangles, 4 program switches and 37 texture binds per frame. Resolution is already 1 device pixel per CSS pixel
without antialiasing (same as Magdalena's canvas). So draw calls and triangles are not the bottleneck; the gap measured online (8.8 against 22 fps) must come from CPU work per
frame (entities, effects, interface updates) or JS memory, so the next step is a per-system timer, not fewer draws. Magdalena could not be sampled again: its test login is no
longer available to this session, so further study there waits for the owner to provide it again.

## 14. First fight observed (level 1 Dark Knight, Lorencia west field around (39,79), 2026-11-12)
- Walking: the joystick pushed to the screen left moves the hero towards lower x and y; from the spawn (140,118) to (39,79) took about 40 s of holding.
- The west field holds Giants (not the weak spiders and dragons expected); two Giants closed in on a level 1 hero and one hit for 57 against 128 HP, so a new hero dies there in 3 hits.
- Mob look: the name ("Giant") sits above a red life bar about 100 px wide; the bar is drawn for every mob in range, not only the target.
- Target look: an orange ring with four small tick marks under the targeted mob; the hit number is red and sits above the hero's head.
- The HP orb turns grey-looking and the life number falls to 12 when low. Lesson for the next pass: level the hero near the spawn first, or use a high level character with GM-free safe tests.

## 15. Movement and a Hound fight (level 1 Dark Knight, 2026-11-12)
- Tapping the ground walks there (a path of a few tiles per tap, it stops at walls); the joystick holds a direction. Pressing the stick towards the screen up-left against the town walls does not slide along them.
- A level 1 Dark Knight (128 HP) died to one Hound at (35,117): a hit of 23, three to five hits to die. West of Lorencia (x 35 to 60, y 105 to 125) holds Hounds and Giants, not spiders. Weak mobs for a new hero are elsewhere; this is why a second pass needs a few levels first.
- Respawn is in the Lorencia town square (about (134,120)), with HP restored, no loss of items seen.
- Tapping a mob attacks it: the hero walks up, a red damage number rises above the mob and the orange ring with four ticks stays under it.
- Near an NPC a pill "Talk" (plus the NPC's role, e.g. "Daily Quest") appears above the bottom bar; tapping it opens the NPC's window as a 270 px wide column on the right edge, full height, dark metal frame, bold title, centred body text, section headings in gold and a wide gold-edged button ("Claim box"). The Daily Quest NPC asks for 250 resets and gives a Box of Reset (5 Jewel of Rare, Purge or Reroll, same chance); it shows account progress "0 / 250".

## 16. Welcome card and server rules (shown on first entry to the world, 2026-11-12)
- A centred card (about 685 x 230 px, dark purple, gold border, round X) with the server logo, the title "Welcome to MuMagdalenas!", and the line "You already have all skills unlocked. Level up and use /reset (at level 400) to grow stronger and stronger", three gold chips (EXP 300x, Reset level 400, All skills) and a wide gold PLAYER GUIDE button.
- This is why every class shows its skills lit at level 1: the server grants all class skills at once. For our server this is the answer to plan F4: grant the class skills at character creation (plugin), not a client list.
- Player Guide: reset at level 400 returns the hero to level 1 with 500 points per accumulated reset (625 for Dark Lord), limit 65,000 per stat, keeps evolution and gear; commands /reset, /agi /str /ene /sta (/vit) /cmd N, and /post message for global chat. Buttons: WhatsApp, Site, CLOSE.

## 17. Lorencia NPC seen near (141,140)
"Market Union Member Julia": a player market NPC. Her window (right column, same frame as the Daily Quest one) offers a Warp button and three wide buttons: Sell, My items, View listings. Text: go to the market in Lorencia to buy items or sell yours. Not part of the classic game; skipped unless the owner asks for a market (the marketplace service in this repo is the equivalent).
The chat Messages panel opens when the chat bubble is tapped: a centred modal with a round X and a "Write a message" field at the bottom.

## 18. Same-method comparison, 15 s samples, software GPU, phone size (2026-11-12)
| | draws/frame | triangles/frame | frames in 15 s |
|---|---|---|---|
| Magdalena, world with about 50 players in view | 44 | 8.6k | 856 (57 fps) |
| This client, offline Lorencia, 40 players + 10 monsters (dev build) | 25 | 24.9k | 602 (40 fps) |
| Same with other players' skill visuals, gear effects and pets off | 24 | 23.7k | 581 |
The crowd options change almost nothing here, so they are not the lever. Draws are already lower than Magdalena's; triangles are about 3 times higher, frames about 30 percent lower. The 8.8 against 22 fps measured earlier was online with a real crowd and the full interface; the remaining gap is more likely interface and network objects than the scene. Next lever: measure online with the performance overlay open, and reduce triangles per character.

## 19. Why the windows are 1.4 times wider (found by measuring the inventory)
The inventory in Magdalena is 270 x 365 px at 915x412, the classic 190 x 429 window. Both ratios follow from stretching the 640x480 interface over the screen: 915/640 = 1.43 across and 412/480 = 0.86 down. The window sits at the top right (x 645 to 915, y 0 to 365). This client now does the same on phones (`windowStretch` in `src/controllers/interface/windowManager.ts`), desktop unchanged.
The COMMANDS menu there has dark brown tiles with warm orange icons, a spaced muted-gold title and a round X; it has 8 entries (Move, Inventory, Allocate points, Ranking, Guild Clan, MU Helper, Settings, Change character, Sign out); a card "Top up by card" can open on top of it: only its OK button is safe to press.

## 20. MU Helper window on a phone (measured from the page, 915x412)
An HTML panel (`helper-panel`), 820 x 400 at (48,10), centred, over a dark veil (rgba(1,4,5,.76)); gold hairline frame.
- Header (57 px): a green round mark with crossed swords (38 px), the title "MU HELPER" (15 px bold, #ffe4a3, spaced), a status pill "Stopped" (9 px, grey) and a round "?" and a round X (36 px).
- Tabs (27 px): COMBAT and PICKUP, 116 x 25 each, centred; the active one has a lighter fill and gold text.
- Combat page, two lanes 393 x 211 side by side, each with a small-caps title: "Attacks" (right side label "ROTATION") and "Buffs" (right side label "ONLY WHEN MISSING"). Top row of each lane: the chosen skills (the attack row has a skill with a small red x to remove; Buffs says "No buffs selected"); below a hairline: the skills that can be added, each with a small green plus badge; unavailable ones are grey with a grey plus.
- Footer (87 px): "Attack range [1]" and "Loot range [1]" selects (48 x 30), an "Original position" toggle, a red "MANUAL" pill; a big green "START HELPER" button at the bottom right (about 150 x 36, green gradient, white bold text).
- Potions row (32 px high): three tinted capsules, HP (red), Mana (blue), SD (purple), each a toggle plus a percent select (default 40%).
This is the model for plan C8; the Pickup tab was not opened.
Pickup tab: a single panel "Auto pickup" with the line "Zen stays automatic. Choose jewels and Kundun boxes to pick up.", an "ALL" toggle at its top right, and a grid of six columns of tiles (125 x 78): a round picture of the item, its name (Kundun +1~+5, Bless, Soul, Chaos, Life, Creation, Guardian, Gemstone, Harmony, Lower refine, Higher refine, Jewel of Socket, and more below). A tile on has a green border and gradient and the word AUTO; off is dark with OFF.

## 21. Corrected skill counts (counted again from the page: enabled tiles, not by eye)
At level 1, skills lit besides the fist: Dark Wizard 1, Dark Knight 6 (of 7), Magic Gladiator 4 (of 21), Dark Lord 6 (of 12), Rage Fighter 4 (of 8), Summoner 0 (of 18). Elf was not recounted (deleted before; first look said 6).
The page gives no skill names, only "Skill 1" to "Skill N" in tile order, so names must be matched by icon. Dark Knight and Magic Gladiator share two icons (a purple sword slash and a spear lunge).
Corrects section 12, which overcounted by one or two.

## 22. Checking the other chat's class lists against the icons (2026-11-12)
- Dark Knight (6): the studied page shows lightning, spear, purple sword, fire burst, red shield and a blue sword. The list given (Crescent Moon Slash, Falling Slash, Lunge, Uppercut, Cyclone, Slash) is plausible except that the red shield looks like Defense (18), which was left out on purpose; one of the six may be Defense and Crescent Moon Slash may be the lightning-like icon. Unverified by name.
- Magic Gladiator (4): shares the spear and the purple sword with the Dark Knight, so it must hold Lunge (20) and Uppercut (21); the other two icons are a red blade with a skull and a fire blade. The list given (Energy Ball, Power Slash, Spiral Slash, Mana Rays) does not match: it has no spear or purple-sword skill.
- Dark Lord (6): the icons are birds and a rider (the Dark Raven commands and mount), plus a blue slash; the list given (Falling Slash, Lunge, Force, Earthshake, Force Wave, Fire Blast) has no bird commands. Probably wrong.
- Rage Fighter (4) and Elf (6): no icon cross-check done yet.

## 23. Hanzo the Blacksmith's shop (Lorencia (115,140), 2026-11-12)
- The Lorencia NPCs and their tiles come from the original `Data/World1/Minimap.bmd`: potion seller (125,86), Hanzo the Blacksmith (114,141), Pasi the Mage (116,112), the barmaid (121,135), vault keepers (146,145) and (144,109), Julia (139,138), card master (130,161).
- The shop window "Merchant" is the classic one stretched like the inventory: x 373 to 643, y 0 to 368, with "Tax rate: 0% (changed in real time)" under the title, the stock grid, a wide "Vender todas las joyas" (sell all jewels) button and two repair hammers at the bottom. The inventory opens beside it. This client already draws both at the same place and size (372 to 644).
- Tapping a shop item shows the classic tooltip on the left (purchase price in green "Purchasing price: 5,995,400", option lines in blue, class lines in red when the hero cannot use it) and picks the item up like a mouse click; tapping the inventory then tries to buy. With 0 zen nothing is bought and no message was seen.
- Difference kept on purpose: this client shows a sheet with the picture, the tooltip and a gold Buy button instead of picking the item up, because a phone has no cursor to carry it (noted for the owner).
- In the Helper the Dark Knight's red shield icon sits under Buffs, so one of its six level 1 skills is a buff (likely Swell Life), not an attack.
