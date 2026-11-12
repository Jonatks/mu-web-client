# Admin service (VM)

Bun service, about 70 MB of RAM, that edits OpenMU's PostgreSQL data on behalf of the Vercel interface.

- Every request needs `x-admin-key` (a long key kept in `/etc/mu-admin/key`, root only). Browser requests (`Origin`) are refused.
- Writes need `x-admin-user` (the admin name, for the audit log) and an empty server: `gate-sidecar.ts` (container `mu-gate`, shares the OpenMU network namespace) counts the sockets on the game ports into `online.json`;
  `gate.ts` refuses to write while any player is connected, or when that file is stale or missing. Creating accounts and reading are always allowed.
- `undo.ts`: every write saves the rows it touches as JSON in `/var/lib/mu-admin/undo` and appends a line to `audit.jsonl`.
  `POST /undo/:id` puts them back (also gated). Passwords are never logged; undo files hold hashes, so the folder is root only.
- The database role `mu_admin` is created by `install-vm.sh` with SELECT on `data` and `config` and write rights on only the tables in `undo.ts`.

Routes: `GET /status`, `/accounts`, `/characters`, `/characters/:name`, `/characters/:name/items`, `/items/definitions[/:id]`, `/audit`, `/undo`;
`POST /accounts`, `/accounts/:login/password`, `/accounts/:login/state`, `/characters/:name/items`, `/undo/:id`; `PATCH /characters/:name`;
`DELETE /characters/:name/items/:id`.

Tests: `bun test admin/service`. Install on the VM: `bash install-vm.sh` (`DB=openmu_probe` to try it on the scratch copy first).
