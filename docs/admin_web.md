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
- A raw-TCP client that stays connected blocks edits until it leaves; there is no kick (OpenMU has none without a plugin).
- Banning a connected player is therefore also refused; ban when the server is empty.
- Experience is set to OpenMU's table value when the level changes.
