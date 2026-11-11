# VM runbook (Oracle Always Free, 155.181.133.84)

What is on the VM and how to change it. Scripts live in `release/vm/`. They are NOT run by the autodeploy (it only unzips the web
client by design: a push never runs code as root). Run them by hand on the VM, in this order. Each one can be undone.

| Order | Script | What it does | Undo |
|---|---|---|---|
| 1 | `backup-db.sh install` | daily Postgres dump at 03:30, keeps 7 days, `restore` command | `backup-db.sh uninstall` |
| 2 | `proxy-harden.sh` | replaces the WebSocket bridge on 8090 (open to any target) with this repo's proxy limited to 44405, 44406 and 45901-45906 | `proxy-harden.sh rollback` |
| 3 | `https-caddy.sh` | HTTPS and wss for free: `https://155-181-133-84.sslip.io` and `wss://ws.155-181-133-84.sslip.io` (Caddy on 443 only) | `https-caddy.sh rollback` |

Step 3 needs one thing in the Oracle console first (free): Security List of the subnet, add an ingress rule TCP 443 from 0.0.0.0/0.

After step 3, copy `release/vm/serverlist.https.md` over `release/vm/serverlist.md`, run `tools/ignies-client/build-release.sh`
and push `release`. Then change the redirect in the Vercel project `mu-valhalla` (`https://mu-valhalla.vercel.app`) from
`http://155.181.133.84/` to `https://155-181-133-84.sslip.io/`.

## What was proven here (local, 2026-11-11)
Proxy with the same `ALLOW_TARGETS`, against a local OpenMU: 127.0.0.1:44405 and :45901 open; :22, :5432, :55980 (OpenMU panel),
169.254.169.254 (cloud metadata), 8.8.8.8 and example.com are refused with HTTP 403.

## Not proven here
The scripts were written without VM access (this session reaches only port 80). They detect the current proxy container by the
port it publishes and stop with a message if they cannot find it. Run them once and read the output before relying on them.

## Rules that stay
- The OpenMU admin panel (55980) is never published. Use an SSH tunnel: `ssh -L 55980:127.0.0.1:55980 ubuntu@155.181.133.84`.
- GitHub tokens used for installs are read-only, short-lived, and deleted afterwards.
