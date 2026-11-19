# fase0

Fase 0 del plan ([../plan/plan_por_fases.md](../plan/plan_por_fases.md)): la preparacion. Cada punto y su estado.

| Punto | Estado | Donde |
|---|---|---|
| 1. Rama `contenido-temporadas` | hecho | mu-web-client |
| 2. Respaldo completo de `openmu` | lo hace `deploy.sh` antes de tocar nada (`/var/backups/mu-db`); restaurar con `release/vm/backup-db.sh restore` | VM |
| 3. Nuestro OpenMU compilado y desplegado, con vuelta atras | `Dockerfile` + `deploy.sh` | VM |
| 4. Generadores de sets y recetas: leer y reescribir da lo mismo | `tools/clientData/roundtrip.ts` (+ prueba); en la VM `roundtrip.sh` | cliente servido |
| 5. SQL repetibles con reversa | `ops/sets/*.sql`, `ops/bloodangel/*.sql` (`-v undo=1`) | VM |
| 6. Set piloto Bes Eclipse probado en el juego | `ops/sets/bes_eclipse.sql`, `client_bes_eclipse.sh` | juego |

## Nuestro OpenMU (punto 3)

La imagen de la VM era el OpenMU oficial + el puente del editor (`mu-openmu-admin`). `deploy.sh <sha>`:
1. guarda esa imagen como `mu-openmu-admin:pre-fase0` (la primera vez);
2. respalda la base;
3. compila **todos** los plugins de `openmu/plugins` contra los DLL de esa imagen (`Dockerfile`, SDK en una etapa de
   docker, nada se instala en la VM) y los deja en `/app/plugins/mu/`, encadenados al hook del puente;
4. recrea solo `openmu` y espera sus puertos; si en 4 minutos no estan, vuelve solo a `:pre-fase0`.

Vuelta atras a mano: `sh deploy.sh rollback`. Con los plugins activos no cambia nada para el jugador mientras
`server.json` tenga `loginTokens: false` y `modulesOff` con `marketplace`: el mercado rechaza todo sin
`MARKETPLACE_ESCROW_SECRET` y la tabla `mu_plugins.login_token` se crea vacia.

Reemplaza a `ops/bloodangel/Dockerfile.craft`, que compilaba solo la mezcla (`-p:Only=Craftings`).
