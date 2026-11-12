#!/bin/bash
# FASE 2a - Se ejecuta EN LA VM (no lo corre el autodespliegue, a proposito). Reversible.
# Cambia el puente WebSocket del puerto 8090 (acepta cualquier destino) por el proxy de este repo con
# ALLOW_TARGETS: solo 44405, 44406 y 45901-45906 de la propia VM, sin rastreo (susurros), banda ni ping.
#
#   bash proxy-harden.sh            # aplica (guarda como respaldo el contenedor/servicio anterior)
#   bash proxy-harden.sh rollback   # vuelve al anterior
#
# Prueba local hecha el 2026-11-11 con el mismo proxy y las mismas reglas: 127.0.0.1:44405 y :45901 abren; :22, :5432,
# :55980 (panel de OpenMU), 169.254.169.254 (metadatos de la nube), 8.8.8.8 y example.com se rechazan con 403.
set -euo pipefail

NAME=mu-proxy
OLD_NAME_FILE=/var/lib/mu-proxy-harden/old-name
DIR=/opt/mu-proxy
PORT=8090
PUBIP=155.181.133.84
# El cliente pide al proxy host=<IP publica> (es la IP que OpenMU anuncia y la de serverlist.md), no 127.0.0.1: se permiten las dos.
RULES="127.0.0.1:44405,127.0.0.1:44406,127.0.0.1:45901,127.0.0.1:45902,127.0.0.1:45903,127.0.0.1:45904,127.0.0.1:45905,127.0.0.1:45906,$PUBIP:44405,$PUBIP:44406,$PUBIP:45901,$PUBIP:45902,$PUBIP:45903,$PUBIP:45904,$PUBIP:45905,$PUBIP:45906"

if [ "${1:-}" = "rollback" ]; then
  sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
  OLD=$(cat "$OLD_NAME_FILE" 2>/dev/null || true)
  [ -n "$OLD" ] || { echo "no hay respaldo del proxy anterior"; exit 1; }
  sudo docker start "$OLD"
  echo "proxy anterior ($OLD) de vuelta"
  exit 0
fi

command -v docker >/dev/null || { echo "falta docker"; exit 1; }
sudo mkdir -p "$(dirname "$OLD_NAME_FILE")"

# El proxy actual: el contenedor que publica el 8090 (o que usa la red del host con ese puerto).
OLD=$(sudo docker ps --format '{{.Names}} {{.Ports}}' | awk -v p=":$PORT->" 'index($0,p){print $1; exit}')
if [ -z "$OLD" ]; then
  echo "No encuentro un contenedor que publique el $PORT. Revisa: sudo ss -ltnp | grep $PORT"
  echo "Si es un servicio systemd o un proceso, detenlo a mano y vuelve a ejecutar con OLD_MANUAL=1."
  [ "${OLD_MANUAL:-}" = "1" ] || exit 1
fi
[ -n "$OLD" ] && echo "$OLD" | sudo tee "$OLD_NAME_FILE" >/dev/null

# Codigo del proxy: el repo es publico y no trae assets de Webzen.
if [ -d "$DIR/.git" ]; then sudo git -C "$DIR" pull -q --ff-only; else sudo git clone -q --depth 1 -b release https://github.com/Jonatks/mu-web-client "$DIR"; fi
( cd "$DIR" && sudo docker run --rm -v "$PWD":/app -w /app oven/bun:1.4.2-slim bun install --frozen-lockfile --ignore-scripts >/dev/null )

start_new() {
  sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
  sudo docker run -d --name "$NAME" --restart unless-stopped --network host --memory 160m \
    -v "$DIR":/app -w /app \
    -e PORT=$PORT -e HOSTNAME=0.0.0.0 -e TRACK=off -e BAND=off -e PING=off \
    -e ALLOW_TARGETS="$RULES" \
    oven/bun:1.4.2-slim bun proxy/main.ts >/dev/null
}

[ -n "$OLD" ] && sudo docker stop "$OLD" >/dev/null
start_new
sleep 4

# Comprobacion: el destino del juego abre y el resto se rechaza. Si falla, se revierte solo.
CHECK=$(mktemp)
cat >"$CHECK" <<'EOF'
const t = (h: string, p: number) => new Promise<string>(r => { const w = new WebSocket(`ws://127.0.0.1:8090/?host=${h}&port=${p}`); const x = setTimeout(() => { r("timeout"); w.close(); }, 4000); w.onopen = () => { clearTimeout(x); r("open"); w.close(); }; w.onerror = () => { clearTimeout(x); r("refused"); }; });
const ok = (await t("155.181.133.84", 44405)) === "open" && (await t("155.181.133.84", 22)) === "refused" && (await t("127.0.0.1", 22)) === "refused" && (await t("127.0.0.1", 5432)) === "refused" && (await t("8.8.8.8", 53)) === "refused";
console.log(ok ? "OK" : "FALLO"); process.exit(ok ? 0 : 1);
EOF
if sudo docker run --rm --network host -v "$CHECK":/c.ts oven/bun:1.4.2-slim bun /c.ts; then
  echo "proxy endurecido activo en el $PORT. Respaldo: ${OLD:-ninguno}. Revertir: bash $0 rollback"
else
  echo "la comprobacion fallo: se revierte"
  sudo docker rm -f "$NAME" >/dev/null 2>&1 || true
  [ -n "$OLD" ] && sudo docker start "$OLD"
  exit 1
fi
