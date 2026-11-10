# Cliente web de Ignies con tus archivos originales

Resultado de la prueba del 2026-11-10 (ver capturas en la conversacion): el cliente
[Ignies/OpenMu-Client-Babylon](https://github.com/Ignies/OpenMu-Client-Babylon) corre en el navegador con
los archivos del cliente 1.04d S6E3 convertidos por sus herramientas, contra un OpenMU local.
Funciona: servidor, login, seleccion de personaje en 3D, Lorencia, HUD, minimapa, inventario con iconos,
ventana de personaje, monstruos 3D, objetivo con barra de vida y animacion de ataque.

**Licencia de ese codigo:** MIT mas una condicion adicional: la ventana de creditos (Ctrl+F8) y su contenido
deben seguir presentes y sin alterar en toda copia, fork o despliegue, "en todo o en parte". Si se reutiliza su
codigo hay que respetarlo (`tools/checks/credits.ts` de su repo lo verifica).

**Los assets derivados del cliente de Webzen no van a ningun repo publico.** Este directorio solo trae el procedimiento.

## Pasos
1. Cliente original: repo privado `Jonatks/mu-assets` (partes `mu-client.zip.partNN`; `cat ... > mu-client.zip`,
   sha256 `6ffa9e7359a40bdcf770a2e9f8f1cd1b26f355b54a18e9e2bc052bc2515fe837`).
2. Clon ligero de Ignies (sin sus ~1,1 GB de assets):
   `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --filter=blob:none --no-checkout https://github.com/Ignies/openmu-client-babylon`
   y `git sparse-checkout set --no-cone '/*' '!/public/game-assets/' '!/public/game-assets-v097d/' '!/public/packs/' '!/public/items/' '!/Data/' '!/Data-v097d/'` y `git checkout main`.
   (No uses `git ls-tree -l` en un clon parcial: descarga todos los archivos.)
3. `bun install --frozen-lockfile --ignore-scripts` (no tiene scripts de instalacion).
4. `build-assets.sh "<Data>" <clon> http://TU-VM/items/` (los iconos se bajan de tu propia VM).
5. Proxy (limitado a tu OpenMU) y Vite; abrir
   `http://127.0.0.1:5173/online?cs=<IP-de-OpenMU>:44405&ws=ws://127.0.0.1:8090&version=S6EP3`.

## Trampas encontradas
- OpenMU debe anunciar una IP **no loopback** (`-resolveIP:<IP>`); el cliente original descarta `127.0.0.1`.
- Tras crear `public/Data` hay que **reiniciar Vite** (escanea `public/` solo al arrancar).
- El cliente pide los sonidos en `.ogg` (no `.wav`) y el terreno en `game-assets/World*/`.
- Su proxy abre cualquier destino si no se fija `ALLOW_TARGETS`; en un servidor publico es obligatorio. El nuestro de la VM (puerto 8090) tampoco lo tiene.
- Su proxy guarda un registro de eventos de personajes (susurros incluidos) en `~/.mu-proxy/track.sqlite`; revisar antes de abrir al publico.
- Consulta el estado de los mundos publicados por Ignies (`ws.ignies.net`): dejar solo nuestro mundo (`server.json`, `directLogin`).
- Sin GPU el dibujo va a ~1 fps; para automatizar, clics sostenidos de ~3 s (ver `/createmonster` y `/teleport` de GM:
  no se puede generar monstruos en zona segura; `testgm` trae 5 personajes equipados).
- Aun sin hacer: capa tactil (joystick, botones), suelo mas claro que el original (iluminacion), despliegue en la VM.
