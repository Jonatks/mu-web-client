# Admin web ("webmaster"): what is built and how it stays safe

An admin signs in with its own user and password and manages accounts, characters and items (a small MU Editor of our own).
Code: [admin/](../admin/readme.md). Live page: `https://mu-valhalla-admin.vercel.app` (Vercel, free).

## Parts
- `admin/web/` on Vercel: the page, its sign-in (admins in the `ADMIN_USERS` env variable, scrypt hashes) and `api/mu.js`, the only route to the VM.
- `admin/service/` on the VM, behind Caddy at `https://155-181-133-84.sslip.io/_admin/` (container `mu-admin`, 80 MB limit): the only code that
  touches OpenMU data. It needs the `x-admin-key` header (key in `/etc/mu-admin/key`, root only, also the Vercel variable `MU_ADMIN_KEY`).
- The database port and the OpenMU panel (55980) are never published. The service reaches PostgreSQL over the Docker network with its own
  role `mu_admin`, which can only write the tables listed below.

## Probe: what an edit touches (write surface)
The OpenMU panel needs a login only its owner can type, so the probe was done on a scratch copy of the database (rows and foreign keys read from
the schema, edits applied, tables compared), not by driving the panel. Result:

| Action | Tables written |
|---|---|
| create account, password, ban | `data."Account"` (`LoginName`, `PasswordHash` bare BCrypt `$2a$11$`, `State` 0 normal, 2 GM, 4 banned) |
| level | `data."StatAttribute"` row "Level" and `data."Character"."Experience"` (set from OpenMU's formula for the level) |
| strength, agility, vitality, energy, leadership | `data."StatAttribute"` rows "Base Strength" ... |
| free points | `data."Character"."LevelUpPoints"` |
| zen | `data."ItemStorage"."Money"` of the character's inventory storage |
| insert item | `data."Item"` plus `data."ItemOptionLink"` (luck: link level 0; additional option: link level 1-4; excellent: link level 0), into the bag grid (slots 12-75) or the account vault (slots 0-119, 0-239 if extended); a chosen slot must fit, else the first free place |
| vault | `data."ItemStorage"` (`Money`); a vault that never existed is created and `Account."VaultId"` set (undo restores `VaultId` before deleting the storage, because the key cascades) |
| edit placed item | `data."Item"` (`Level`, `Durability`, `HasSkill`, `SocketCount`, `PetExperience`) and its luck / additional / excellent `data."ItemOptionLink"` rows; ancient, socket and harmony links are kept |
| move item | `data."Item"` (`ItemSlot`, `ItemStorageId`): inside its storage, or between a character inventory and the vault of the same account; equipment slots are never targets |
| skills | `data."SkillEntry"` (add, level, remove) |
| delete character / account | the rows of the character (stats, skills, inventory storage and items) or of an account without characters (and its vault); refused when a table the panel does not know still points at the row |
| advanced character | `data."Character"` (`Name`, `CharacterClassId`, `CurrentMapId`, `PositionX`, `PositionY`, `PlayerKillCount`, `Experience`, `MasterLevelUpPoints`, and when the version has them `CharacterStatus`, `State`, `StateRemainingSeconds`, `UsedFruitPoints`, `UsedNegFruitPoints`, `InventoryExtensions`, `MasterExperience`) |
| advanced account | `data."Account"` (`LoginName`, `EMail`, `SecurityCode`, `VaultPassword` cleared, `IsVaultExtended`, and when the version has them `LanguageIsoCode`, `TimeZone`, `ChatBanUntil`, `WCoinC`, `WCoinP`, `GoblinPoints`) |
| delete item | `data."Item"` (its links go with it; the saved copy also keeps `data."ItemItemOfItemSet"`) |

Item options come from `config."ItemDefinitionItemOptionDefinition"` -> `config."IncreasableItemOption"` (type and number), so only options that
item can really carry are accepted. Master level and resets are counters (a StatAttribute row is created on the first edit). Class changes only swap the class: points, skills and items are not touched, and the in-game evolution is a quest the panel does not edit. Not built: creating a character (do it in the game), quests, letters, guild, unlocked classes.
Vault slots are numbered from 0 (verify in game with the first inserted vault item).

## Server settings (the "Servidor" page)
These edit the game configuration (`config` schema), not a player, so they do not need the server empty. OpenMU reads them at start: the page's
"Reiniciar servidor" disconnects everybody (each character is saved), leaves a `restart` file and a system unit on the VM (`mu-restart.path`)
restarts OpenMU. A full start takes about three minutes on the 1 GB VM.

| Tab | Tables written | Notes |
|---|---|---|
| Experiencia y reglas | `config."GameConfiguration"`, `GameServerDefinition`, `GameServerConfiguration` | `ExperienceRate`, `MasterExperienceRate`, limits, money caps, drop time (an interval), per-server rate, PvP, player cap. Final experience is rules x server x map |
| Mapas | `config."GameMapDefinition"."ExpMultiplier"` | the terrain (`TerrainData`, 3 header bytes then 256 x 256 tiles) is read to draw the spot picker |
| Drops | `config."DropItemGroup"` | chance 0 to 1 (100% = always), monster level range; "scale" multiplies the chance of the chosen kinds, never above 1 |
| Mobs y spots | `config."MonsterSpawnArea"` (insert, update, delete) | rectangle, quantity, direction; a rectangle with no walkable tile (terrain byte 0) is refused |
| Monstruos | `config."MonsterDefinition"`, `MonsterAttribute` | respawn, move and attack delays (intervals), ranges, max drops, stats |
| Tiendas | `data."Item"` of the NPC's `MerchantStoreId` | same item picker and checks as a vault (8 x 15 grid) |
| Eventos | `config."MiniGameDefinition"` | durations (intervals), players, levels, entrance fee |
| Teletransportes | `config."WarpInfo"` | cost and level of each `/move` destination |
| Avanzado | `config."PlugInConfiguration"` | active flag and JSON (`CustomConfiguration`: Happy Hour, invasions, event schedules); names come from OpenMU's resources (`admin/service/plugin_names.json`) |

The page is built to be read before it is edited. The top strip (`GET /server/overview`) shows experience, master experience, monsters in spots,
the average chance of random drops, the player cap, and how many saved server changes still wait for a restart (counted from the audit log back to the last
`server.restart` line; a change and its undo cancel out), with a "Reiniciar ahora" button. Each tab opens with its own summary tiles. While a field is edited the page shows
`old -> new (+/-)` next to it, on the matching tile, and in a bar of pending changes with Descartar and Guardar. Nothing is sent until Guardar; drop scaling
and spot creation are previewed in the browser from data already loaded.

Every change goes through the same copy-before-write and undo as player edits. Column types were read from the real database (several `integer`
look-alikes are `interval`, so durations are sent as seconds through `make_interval`).

## Log cleaner (the "Registro" page)
`GET /audit/stats` gives the number of lines, the oldest date and the sizes of the log and the undo copies. `POST /audit/clean` (`{days, undo, dryRun}`, admin only)
removes lines older than `days` (`null` is everything) and the undo copies that go with them. The dialog asks for a dry run first and shows how many lines and
copies would go. It always keeps server changes saved since the last restart and the last restart line (the page counts them as "waiting for a restart"), and
unless "undo" is ticked it keeps every change that can still be undone. The clean writes one `log.clean` line. Code: `admin/service/logclean.ts`.

## Rules that keep data safe
1. **Nobody connected.** OpenMU keeps a player's data in memory while he is online, so a write under a connected player is lost or overwrites
   him. OpenMU has no online list and no kick, so the service refuses every write (except creating an account) while any socket is
   established on the game ports 45901-45906, and when it cannot tell. The check is the container `mu-gate`: it shares OpenMU's network
   namespace and writes the counts to `online.json` every 2 s (the host's own socket table does not see players who connect directly, so it is not used).
   A stale or missing file blocks writes. The page shows the state at the top.
2. **Copy before every write.** `undo.ts` saves the affected rows as JSON before each change; `POST /undo/:id` puts them back (also behind the gate).
   Undo overwrites newer progress of that row, so use it soon. A nightly full dump already exists (`backup-db.sh`).
3. **Audit.** One line per write in `/var/lib/mu-admin/audit.jsonl` (who, what, when; never passwords).
4. **Least privilege.** Role `mu_admin`: SELECT on `data` and `config`; INSERT/UPDATE on `Account`; UPDATE on `Character`, `StatAttribute`,
   `ItemStorage`; INSERT/UPDATE/DELETE on `Item`, `ItemOptionLink`, `ItemItemOfItemSet`.
5. **No secrets in the repo.** `MU_ADMIN_KEY`, `ADMIN_USERS` and the role password live in Vercel variables and root-only files on the VM.
   Sessions are an HttpOnly, Secure, SameSite=Strict cookie signed with a key derived from `MU_ADMIN_KEY`, 8 hours; writes need a same-origin request.

## Setting it up (owner steps)
- VM: `bash install-vm.sh` (see `admin/service/readme.md`). `DB=<name>` picks the database; `bash install-vm.sh rollback` removes it.
- Vercel project `mu-valhalla-admin` (root directory `admin/web`): set `MU_ADMIN_URL`, `MU_ADMIN_KEY`, `ADMIN_USERS`. Make an admin entry with
  `node admin/web/mkhash.mjs NAME` and paste the line it prints.

## Known limits
- A raw-TCP client that stays connected blocks player edits until it leaves; "Desconectar" closes every game socket, and with the admin bridge
  plugin one account can be disconnected on its own (`openmu/readme.md`).
- Banning a connected player is refused; disconnect them first.
- Server settings apply after a restart; undoing one needs the server empty like any other undo.
- Experience is set to OpenMU's table value when the level changes.
