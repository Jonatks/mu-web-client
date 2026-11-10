#!/bin/bash
# Construye release/mu-web-update.zip: SOLO el codigo del cliente (sin assets de Webzen), listo para la rama `release`.
# La VM (autodespliegue) lo extrae encima del cliente instalado con vm-install.sh. Requiere los assets locales
# (ignorados por git): Data/, public/game-assets/, public/items/ (ver build-assets.sh).
set -euo pipefail
cd "$(dirname "$0")/../.."

for d in Data public/game-assets public/items; do
  [ -d "$d" ] || { echo "Falta $d: genera los assets primero (tools/ignies-client/build-assets.sh)"; exit 1; }
done
[ -f release/vm/server.json ] && [ -f release/vm/serverlist.md ] || { echo "Faltan release/vm/server.json o serverlist.md"; exit 1; }

echo "== construyendo"
rm -rf dist
APP_ENV=prod node_modules/.bin/vite build > /tmp/mu-build-vite.log 2>&1 || { tail -20 /tmp/mu-build-vite.log; exit 1; }
bun run tools/copyData.ts > /tmp/mu-build-copydata.log 2>&1
bun run tools/assetsIndex.ts > /tmp/mu-build-index.log 2>&1
cp release/vm/server.json release/vm/serverlist.md dist/

echo "== empaquetando solo el codigo"
rm -f release/mu-web-update.zip
( cd dist && zip -qr ../release/mu-web-update.zip . -x 'game-assets/*' 'Data/*' 'items/*' '*.gz' )
ls -la release/mu-web-update.zip | awk '{print $5, $9}'
unzip -l release/mu-web-update.zip | tail -1
echo "Para publicar: probar con 'vite preview' y luego 'git push origin main:release'."
