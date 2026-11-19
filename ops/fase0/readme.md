# fase0

Fase 0 del plan ([../plan/plan_por_fases.md](../plan/plan_por_fases.md)): la preparacion. Cada punto y su estado.

| Punto | Estado | Donde |
|---|---|---|
| 1. Rama `contenido-temporadas` | hecho | mu-web-client |
| 2. Respaldo completo de `openmu` | hecho 19-11-2026 (`openmu-20261119-195430.sql.gz`, 2 MB); lo repite `deploy.sh` antes de tocar nada (`/var/backups/mu-db`); restaurar con `release/vm/backup-db.sh restore` | VM |
| 3. Nuestro OpenMU compilado y desplegado, con vuelta atras | hecho 19-11-2026: `/app/plugins/mu/MUnique.OpenMU.MuPlugins.dll`, plugins registrados, tabla `mu_plugins.login_token` creada, puertos arriba | `Dockerfile` + `deploy.sh` |
| 4. Generadores de sets y recetas: leer y reescribir da lo mismo | hecho: los 7 archivos del cliente servido salen identicos; `tools/clientData/roundtrip.ts` (+ prueba); en la VM `roundtrip.sh` | cliente servido |
| 5. SQL repetibles con reversa | hecho: `ops/sets/*.sql`, `ops/bloodangel/*.sql` (`-v undo=1`) | VM |
| 6. Set piloto Bes Eclipse probado en el juego | cargado (2 piezas: Staff of Destruction 5/8 y Eclipse Pants 9/35); falta la prueba en el juego | `ops/sets/bes_eclipse.sql`, `client_bes_eclipse.sh` | juego |

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

## Lo que se vio al desplegar

- `PlugInManager` no lee la configuracion de `AddClassSkillsOnCreate` (7d2c9e41, del puente de mu-admin): error de
  JSON (`MetadataUnexpectedProperty`). Es el pendiente "habilidad inicial de Summoner"; no lo trae este despliegue.
- `InvalidPacketHeaderException` con `GET / HTTP/1.1`: un escaner de internet pidiendo HTTP al puerto del juego. Sin efecto.
