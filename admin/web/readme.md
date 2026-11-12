# Admin web (Vercel)

Static page plus serverless functions. Sign-in uses the admins in the `ADMIN_USERS` environment variable; the functions in `api/` forward
calls to the VM service with `MU_ADMIN_KEY`. Nothing secret is in the repo. See [readme.md in admin/](../readme.md).

Files: `public/` is the page (`index.html`, `app.js`, `app.css`: sidebar, dialogs, live search, item suggestions as you type, equipment doll, 8x8 bag and vault grids; everyday fields in view, rare ones under "Opciones avanzadas"); `api/login.js`, `logout.js`, `me.js` handle the session; `api/mu.js` is the only
route to the VM service and only forwards the paths it lists; `lib/auth.js` holds scrypt, the signed cookie and the same-origin check (tests next to it).
`mkhash.mjs NAME` prints the `ADMIN_USERS` entry for one admin (it asks for the password hidden).

Environment variables (Vercel project settings, never in the repo): `MU_ADMIN_URL` (`https://<host>/_admin`), `MU_ADMIN_KEY` (the VM key),
`ADMIN_USERS` (`name=scrypt$...;name2=scrypt$...`).

Item icons: `public/items/<group>_<number>.webp` (72px) and `public/items/index.json` (which ones exist) are made from the client's pre-rendered icons by
`python3 admin/web/tools/item_icons.py` (run from the repo root; it needs `public/items` built by the client). The item picker shows them next to category
chips that come from `GET /items/categories`, so only kinds the server really has (for the character's class line and body slot) are offered.

`public/server.js` is the `Servidor` page (tabs for rules, spots map, drops, monsters, shops, events, warps and plug-ins). It gets the page helpers from `app.js`. Every tab starts with summary tiles and shows "old -> new (+/-)" while a field is edited (`draftKit`, `stat`, `savebar` inside the file). `app.js` also holds the log cleaner dialog on the `Registro` page.

## Look
`public/app.css` ends with the "app look" layer: Android-style rounded surfaces, tonal buttons, a navigation drawer on wide screens, and on phones (860 px and below) a top bar plus a bottom navigation bar, dialogs that slide up as sheets, and a snackbar toast. The colours are tokens at the top of the file (dark and light), so a new component should use them and the `--r-*` radii instead of its own values. No inline `style` attributes (the page CSP forbids them).
