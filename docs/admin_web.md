# Admin web ("webmaster"), phase 4: design and what is not built

Goal: an admin signs in with its own user and password and manages accounts, characters and items (a MU Editor of our own).

## Status
Not built. It needs a service on the VM (the only thing allowed near the database), and this session has no access to the VM. A Vercel
page with a login and nothing behind it would be decoration, so none was published.

## Design that was settled
- Vercel (free) hosts the UI and its admin login (a list of admin users kept as Vercel environment variables, passwords hashed).
- A small service on the VM (HTTPS through the same Caddy, a long random API key) is the only code that touches OpenMU data. The database port is never published.
- OpenMU keeps a player's data in memory while the player is connected, so editing the database under a connected player is lost or
  overwritten. Rule for every write: kick the player first (OpenMU admin API or `/disconnect`), edit, never edit a connected account.
- Reuse before writing: `register/` (account sign-up), `ops/` (event reader), `marketplace/` (item moves with a signed token). The OpenMU
  admin panel (Blazor, port 55980, SSH tunnel only) already edits accounts, characters, inventory and skills; the web should wrap the safe
  subset, not replace it.

## MVP order
1. Admin sign-in. 2. Create and list accounts, change password. 3. Ban and unban (account State). 4. List characters.
5. Edit level, stats, zen. 6. View and insert items. Later: vault, skills, maps, logs.

## First step to take when the VM is reachable
Run the OpenMU admin panel through the tunnel, create an account, edit a character with the player offline, and note which tables the
panel touches (`data."Account"`, `data."Character"`, `data."ItemStorage"`). That list is the service's whole write surface.
