# Admin web

A small admin panel for the MU server (what MU Editor does for accounts, characters and items), in two parts:

- `service/` - runs on the VM next to OpenMU, behind Caddy at `https://<host>/_admin/`. It is the only code that touches the OpenMU database.
- `web/` - the interface and its own admin login, hosted on Vercel (free). It never sees the database or the OpenMU panel (port 55980).

The design, the write surface and the rules are in [docs/admin_web.md](../docs/admin_web.md).
