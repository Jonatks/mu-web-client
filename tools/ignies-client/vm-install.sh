#!/bin/bash
# Instala en la VM el cliente web nuevo (basado en Ignies/OpenMu-Client-Babylon, MIT + condicion de creditos).
# Se ejecuta EN LA VM:   GITHUB_TOKEN=<token de solo lectura> bash vm-install.sh
#
# Que hace (todo reversible):
#   1. Descarga de Jonatks/mu-assets (repo PRIVADO) el codigo compilado y los assets (5 partes) y verifica sha256.
#   2. Arma el cliente en /opt/openmu/web/client-ignies (reusa la carpeta items/ del cliente actual).
#   3. Guarda copia de nginx.conf, escribe la nueva y cambia las carpetas:
#        client  -> client-old-<fecha>   (respaldo, no se borra)
#        client-ignies -> client
#   4. Reinicia el contenedor "web" y comprueba que responda. Si algo falla, vuelve atras solo.
# El token solo se usa en esta ejecucion; no se guarda en disco. Crealo de solo lectura, solo para mu-assets y con vencimiento corto.
set -euo pipefail
: "${GITHUB_TOKEN:?Falta GITHUB_TOKEN (fine-grained, solo lectura de contenido en Jonatks/mu-assets)}"

REPO="Jonatks/mu-assets"
DIR="ignies-client"
WEB=/opt/openmu/web
OLD="$WEB/client"
NEW="$WEB/client-ignies"
TMP="$WEB/_ignies-tmp"
STAMP=$(date +%Y%m%d-%H%M)
BACKUP="$WEB/client-old-$STAMP"

echo "== 0/6 comprobaciones"
[ -d "$OLD" ] || { echo "No existe $OLD"; exit 1; }
command -v unzip >/dev/null || { echo "Falta unzip: sudo apt-get install -y unzip"; exit 1; }
AVAIL_GB=$(df -BG --output=avail "$WEB" | tail -1 | tr -dc '0-9')
echo "espacio libre: ${AVAIL_GB} GB (hacen falta ~3 GB)"
[ "$AVAIL_GB" -ge 3 ] || { echo "Poco espacio libre, abortando"; exit 1; }
sudo docker ps --format '{{.Names}}' | grep -qx web || { echo "No encuentro el contenedor 'web'"; exit 1; }

echo "== 1/6 descarga desde el repo privado"
sudo rm -rf "$TMP"; sudo mkdir -p "$TMP"; sudo chown "$(id -u):$(id -g)" "$TMP"
dl() { curl -fsSL --retry 3 -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3.raw" -o "$TMP/$1" "https://api.github.com/repos/$REPO/contents/$DIR/$1"; }
dl SHA256SUMS
dl ignies-code.zip
for n in 00 01 02 03 04; do echo "  parte $n"; dl "ignies-assets.zip.part$n"; done
unset GITHUB_TOKEN

echo "== 2/6 verificacion"
cat "$TMP"/ignies-assets.zip.part* > "$TMP/assets.zip"
sudo rm -f "$TMP"/ignies-assets.zip.part*
( cd "$TMP" && mv ignies-code.zip code.zip && sed -i 's/ ignies-code.zip/ code.zip/' SHA256SUMS && sha256sum -c SHA256SUMS )

echo "== 3/6 armando el cliente nuevo en $NEW"
sudo rm -rf "$NEW"; sudo mkdir -p "$NEW"; sudo chown "$(id -u):$(id -g)" "$NEW"
unzip -q "$TMP/code.zip" -d "$NEW"
unzip -q "$TMP/assets.zip" -d "$NEW"
# Contents of items/, not the folder itself: if the package already has items/, copying the folder would nest items/items.
if [ -d "$OLD/items" ]; then mkdir -p "$NEW/items"; cp -al "$OLD/items/." "$NEW/items/" 2>/dev/null || cp -a "$OLD/items/." "$NEW/items/"; else echo "AVISO: el cliente actual no tiene items/ (los iconos no se verian)"; fi
sudo rm -rf "$TMP"
for f in index.html server.json serverlist.md Data/gate.bmd game-assets/World1/EncTerrain1.att; do [ -e "$NEW/$f" ] || { echo "Falta $f en el paquete"; exit 1; }; done

echo "== 4/6 nginx.conf (con respaldo)"
sudo cp "$WEB/nginx.conf" "$WEB/nginx.conf.bak-$STAMP"
sudo tee "$WEB/nginx.conf" >/dev/null <<'EOC'
types { model/gltf-binary glb; }
include /etc/nginx/mime.types;
gzip on;
gzip_static on;
gzip_vary on;
gzip_comp_level 5;
gzip_types text/css text/javascript application/javascript application/json text/plain image/svg+xml application/wasm model/gltf-binary application/octet-stream;
server {
  listen 80;
  root /usr/share/nginx/html;
  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /server.json { add_header Cache-Control "no-cache"; }
  location = /serverlist.md { default_type text/plain; add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location = /build.json { add_header Cache-Control "no-cache"; }
  location ~ ^/assets-index.*\.json$ { add_header Cache-Control "no-cache"; }
  location /assets/ { try_files $uri =404; expires 30d; add_header Cache-Control "public, max-age=2592000, immutable"; }
  location /game-assets/ { try_files $uri =404; expires 30d; add_header Cache-Control "public, max-age=2592000"; }
  location /Data/ { try_files $uri =404; expires 30d; add_header Cache-Control "public, max-age=2592000"; }
  location /items/ { try_files $uri =404; expires 30d; add_header Cache-Control "public, max-age=2592000"; }
  location / { try_files $uri $uri/ /index.html; add_header Cache-Control "no-cache"; }
}
EOC

echo "== 5/6 cambio de carpetas y reinicio"
rollback() {
  echo "!! FALLO: volviendo al cliente anterior"
  sudo mv "$OLD" "$WEB/client-ignies-fallido" 2>/dev/null || true
  sudo mv "$BACKUP" "$OLD"
  sudo cp "$WEB/nginx.conf.bak-$STAMP" "$WEB/nginx.conf"
  sudo docker restart web >/dev/null
  echo "Cliente anterior restaurado."
  exit 1
}
sudo mv "$OLD" "$BACKUP"
sudo mv "$NEW" "$OLD"
sudo docker restart web >/dev/null
sleep 3

echo "== 6/6 comprobaciones"
code() { curl -s -o /dev/null -w '%{http_code}' "http://localhost$1"; }
[ "$(code /)" = 200 ] || rollback
[ "$(code /server.json)" = 200 ] || rollback
[ "$(curl -s http://localhost/server.json | grep -c directLogin)" -ge 1 ] || rollback
[ "$(code /Data/gate.bmd)" = 200 ] || rollback
[ "$(code /game-assets/World1/EncTerrain1.att)" = 200 ] || rollback
[ "$(code /items/item_0_0_0.png)" = 200 ] || rollback
echo "OK: cliente nuevo en linea; abre la IP publica de la VM en el navegador (puerto 80)."
echo "Respaldo del anterior: $BACKUP   (volver atras: sudo mv $OLD $WEB/client-nuevo && sudo mv $BACKUP $OLD && sudo cp $WEB/nginx.conf.bak-$STAMP $WEB/nginx.conf && sudo docker restart web)"
sudo docker ps --format "table {{.Names}}\t{{.Status}}"
