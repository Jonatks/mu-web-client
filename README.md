# MU Web (cliente de pruebas)

Cliente web móvil para un servidor OpenMU (Season 6 E3), basado en
[afrokick/muonlinejs](https://github.com/afrokick/muonlinejs) (MIT).
Versión preliminar: launcher, pantalla de carga, modo horizontal, login,
personajes y HUD táctil.

Este repositorio contiene solo código. Los assets del juego no están incluidos.
`release/` trae el build listo para desplegar (`update-web.sh`).

## Despliegue automático en la VM

Una sola vez, en la VM (instala un temporizador systemd que cada 3 minutos baja
`release/mu-web-update.zip` de la rama `release` y lo publica si cambió (solo descarga si el ETag cambió); solo baja archivos
estáticos, el script de despliegue queda fijo en la VM):

```bash
curl -fsSL https://raw.githubusercontent.com/Jonatks/mu-web-client/release/release/install-autodeploy.sh -o install-autodeploy.sh && bash install-autodeploy.sh
```

Desde ahí solo se publica lo que se pasa a `release`. Con una versión probada y su
`release/mu-web-update.zip` ya en `main`:

```bash
git push origin main:release
```

Queda en línea en unos minutos. Los push normales a `main` NO publican nada. Registro: `sudo journalctl -u mu-web-autodeploy -f`.

## Prueba de extremo a extremo (Playwright)

`tools/e2e/flow.js` recorre launcher → servidor → login → personajes → (crear) → mundo
en un Pixel 7 horizontal y guarda capturas en `e2e-shots/`. Para probar sin la VM se
puede levantar OpenMU en modo demo (cuentas test0..test9, contraseña = usuario):

```bash
docker run -d --name openmu -p 127.0.0.1:44405-44406:44405-44406 -p 127.0.0.1:45901-45906:45901-45906 munique/openmu:latest -demo -autostart -resolveIP:127.0.0.1
```

```bash
PORT=8090 HOSTNAME=127.0.0.1 bun run proxy/main.ts &
node tools/e2e/devserve.js "$PWD/dist" 8089 &
```

```bash
BASE=http://localhost:8089/ LOCAL_MU=1 MU_USER=test2 NEWCHAR=Prueba1 node tools/e2e/flow.js
```

`devserve.js` sirve `dist/` y pide a la VM lo que falte (game-assets, items).
