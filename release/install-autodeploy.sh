#!/bin/bash
# Instala en la VM un despliegue automático "pull": cada 3 minutos revisa si
# release/mu-web-update.zip cambió en la rama main y, si cambió, lo publica.
#
# Uso (una sola vez, en la VM):
#   curl -fsSL https://raw.githubusercontent.com/Jonatks/mu-web-client/main/release/install-autodeploy.sh -o install-autodeploy.sh
#   bash install-autodeploy.sh
#
# Seguridad: solo se descarga el zip (archivos estáticos de la web). El script que
# lo despliega queda instalado localmente en /usr/local/bin y NO se vuelve a bajar
# de GitHub, así que un push nunca ejecuta código como root en la VM.
# Para desinstalar:  sudo systemctl disable --now mu-web-autodeploy.timer
set -euo pipefail

sudo tee /usr/local/bin/mu-web-autodeploy >/dev/null <<'EOS'
#!/bin/bash
set -euo pipefail
URL="https://raw.githubusercontent.com/Jonatks/mu-web-client/main/release/mu-web-update.zip"
WEB=/opt/openmu/web/client
DIR=/var/lib/mu-web-autodeploy
mkdir -p "$DIR"
curl -fsSL --retry 3 -o "$DIR/new.zip" "$URL?t=$(date +%s)"
NEW=$(sha256sum "$DIR/new.zip" | cut -d' ' -f1)
OLD=$(cat "$DIR/deployed.sha" 2>/dev/null || true)
[ "$NEW" = "$OLD" ] && exit 0
unzip -tq "$DIR/new.zip" >/dev/null   # zip íntegro antes de tocar nada
LIST=$(unzip -Z1 "$DIR/new.zip")
grep -qx 'index.html' <<<"$LIST" || { echo "zip sin index.html, se ignora"; exit 1; }
echo "nueva versión $NEW, desplegando..."
rm -rf "$WEB/assets"
unzip -oq "$DIR/new.zip" -d "$WEB"
find "$WEB" -type f \( -name '*.glb' -o -name '*.js' -o -name '*.json' -o -name '*.css' -o -name '*.wasm' -o -name '*.html' -o -name '*.tga' -o -name '*.TGA' -o -name '*.bmd' -o -name '*.svg' \) ! -name '*.gz' -size +1k -print0 \
  | xargs -0 -r -P 2 -I{} sh -c '[ -f "{}.gz" ] && [ "{}.gz" -nt "{}" ] || nice -n 10 gzip -9 -kf "{}"'
echo "$NEW" > "$DIR/deployed.sha"
date -Is > "$DIR/deployed.at"
echo "desplegado"
EOS
sudo chmod 755 /usr/local/bin/mu-web-autodeploy

sudo tee /etc/systemd/system/mu-web-autodeploy.service >/dev/null <<'EOS'
[Unit]
Description=Despliegue automático del cliente MU web desde GitHub
After=network-online.target docker.service

[Service]
Type=oneshot
Nice=10
ExecStart=/usr/local/bin/mu-web-autodeploy
EOS

sudo tee /etc/systemd/system/mu-web-autodeploy.timer >/dev/null <<'EOS'
[Unit]
Description=Revisa cada 3 minutos si hay una versión nueva del cliente MU web

[Timer]
OnBootSec=1min
OnUnitActiveSec=3min
Persistent=true

[Install]
WantedBy=timers.target
EOS

sudo systemctl daemon-reload
sudo systemctl enable --now mu-web-autodeploy.timer
sudo systemctl start mu-web-autodeploy.service || true
sudo journalctl -u mu-web-autodeploy.service -n 5 --no-pager
systemctl list-timers mu-web-autodeploy.timer --no-pager
echo "Listo. Registro:  sudo journalctl -u mu-web-autodeploy -f"
