# Admin web (Vercel)

Static page plus serverless functions. Sign-in uses the admins in the `ADMIN_USERS` environment variable; the functions in `api/` forward
calls to the VM service with `MU_ADMIN_KEY`. Nothing secret is in the repo. See [readme.md in admin/](../readme.md).

Files: `public/` is the page (`index.html`, `app.js`, `app.css`: sidebar, dialogs, live search, item suggestions as you type, equipment doll, 8x8 bag and vault grids; everyday fields in view, rare ones under "Opciones avanzadas"); `api/login.js`, `logout.js`, `me.js` handle the session; `api/mu.js` is the only
route to the VM service and only forwards the paths it lists; `lib/auth.js` holds scrypt, the signed cookie and the same-origin check (tests next to it).
`mkhash.mjs NAME` prints the `ADMIN_USERS` entry for one admin (it asks for the password hidden).

Environment variables (Vercel project settings, never in the repo): `MU_ADMIN_URL` (`https://<host>/_admin`), `MU_ADMIN_KEY` (the VM key),
`ADMIN_USERS` (`name=scrypt$...;name2=scrypt$...`).
