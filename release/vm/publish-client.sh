#!/bin/bash
# Publica el cliente para la VM sin Data/ local: compila, pone el server.json y la lista de mundos de la VM, arma el zip
# (sin game-assets, Data, items ni .gz), compara la lista de archivos con el zip anterior y deja el zip listo para commit.
# Despues: git add release/mu-web-update.zip && git commit && git push origin HEAD:release
set -eu
cd "$(dirname "$0")/../.."
rm -rf dist
APP_ENV=prod NODE_OPTIONS=--max-old-space-size=6144 node_modules/.bin/vite build >/dev/null
cp release/vm/server.json release/vm/serverlist.md dist/
grep -q 'wss://ws\.' dist/serverlist.md || { echo "la lista de mundos no apunta al proxy de la VM"; exit 1; }
T=$(mktemp -d)
(cd dist && zip -qr9 "$T/new.zip" . -x 'game-assets/*' 'Data/*' 'items/*' '*.gz')
names() { unzip -Z1 "$1" | sed 's/-[A-Za-z0-9_-]\{8\}\././' | sort; }
if ! diff <(names release/mu-web-update.zip) <(names "$T/new.zip") >/dev/null 2>&1; then
  echo "cambia la lista de archivos:"; diff <(names release/mu-web-update.zip) <(names "$T/new.zip") || true
fi
mv "$T/new.zip" release/mu-web-update.zip
echo "listo: release/mu-web-update.zip"
