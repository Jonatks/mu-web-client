# Launch checklist (private test server)

The server is a private test with no payments, so opening it needs no credentials or money. Check in this order.

1. [ ] `docs/vm_runbook.md` steps 1 to 3 done and read back (backup runs, proxy refuses other targets, HTTPS opens).
2. [ ] Test accounts `test0` to `test7`, `testgm` and the demo accounts: ban them or change their passwords from the OpenMU admin
       panel through the SSH tunnel (Accounts, State). Keep one GM account of your own with a strong password.
3. [ ] Registration: the fork ships `register/` (a sign-up site). It needs the VM compose stack of `install/`, which the VM does not
       run today. Until then create accounts by hand from the admin panel.
4. [ ] RAM: the VM has 1 GB. Watch `free -m` with 2 to 3 players. Docker memory limits are in the scripts (proxy 160 MB, Caddy 96 MB).
5. [ ] Legal notice on the start page: the game files are the owner's own copy of MU 1.04d and are not redistributed in the repo.
6. [ ] Invite one or two friends, ask for the phone model and browser, and read `/admin` or the OpenMU log for resync warnings.
