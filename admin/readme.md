# Admin web

A small admin panel for the MU server (what MU Editor does for accounts, characters and items), in two parts:

- `service/` - runs on the VM next to OpenMU, behind Caddy at `https://<host>/_admin/`. It is the only code that touches the OpenMU database.
- `web/` - the interface and its own admin login, hosted on Vercel (free). It never sees the database or the OpenMU panel (port 55980).

The design, the write surface and the rules are in [docs/admin_web.md](../docs/admin_web.md).

## Working on it

- Deploy the page with the Vercel MCP (`create_deployment`, project `mu-valhalla-admin`, root `admin/web`, production) from a pushed commit SHA. No browser needed.
- Open the browser only for what needs it: the Cloud Shell terminal that reaches the VM (run `install-vm.sh` fetched by commit SHA), or a click only the owner can do.
- The owner checks results in the game later; test writes on a throwaway account, undo them, and say what was not verified.

Disconnecting one player: with the admin bridge plugin running (see [openmu/readme.md](../openmu/readme.md)) the service reads `bridge/players.json`
(`GET /players/online`) and `POST /players/disconnect {"login"}` disconnects that account only; without a login (or without the plugin) the button
closes every connection, as before.

Server settings (experience, drops, spawn spots, shops, events, warps, plug-ins) are the `Servidor` page and `service/server.ts`; the restart that
applies them is `kick.ts` (`restartServer`) plus the `mu-restart` unit that `install-vm.sh` sets up. Details: [docs/admin_web.md](../docs/admin_web.md).
