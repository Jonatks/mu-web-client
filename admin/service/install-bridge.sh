#!/usr/bin/env bash
# Puts the admin bridge plugin into the running OpenMU (one restart of the game server), or takes it out again.
#   sudo bash install-bridge.sh ~/MUnique.OpenMU.MuAdminBridge.dll    install
#   sudo bash install-bridge.sh rollback                              back to the stock image
# Refuses while anybody is connected: the restart would cut them off.
set -euo pipefail
STACK=/opt/openmu; DATA=/var/lib/mu-admin; BRIDGE=$DATA/bridge
cd "$STACK"
BASE=(-f docker-compose.yml -f docker-compose.override.yml)

# mu-gate and mu-kick share OpenMU's network, so a recreated openmu needs them recreated too (install-admin.sh does it).
restart_sidecars() {
  local here; here=$(dirname "$(readlink -f "$0")")
  if [ -f "$here/install-admin.sh" ]; then DB=${DB:-openmu} bash "$here/install-admin.sh" >/dev/null; else echo "Falta recrear mu-gate y mu-kick: sudo DB=openmu bash ~/install-admin.sh"; fi
}

if [ "${1:-}" = rollback ]; then
  rm -f docker-compose.bridge.yml
  docker compose "${BASE[@]}" up -d openmu
  restart_sidecars
  echo "Plugin quitado: OpenMU vuelve a su imagen normal."
  exit 0
fi

DLL=${1:?Falta la ruta del DLL}
[ -s "$DLL" ] || { echo "No existe $DLL"; exit 1; }
EST=$(grep -o '"established":[ ]*[0-9]*' "$DATA/online.json" | grep -o '[0-9]*$' || echo x)
[ "$EST" = 0 ] || { echo "Hay jugadores conectados (o la puerta no responde): no se reinicia el servidor."; exit 1; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cp "$DLL" "$T/MUnique.OpenMU.MuAdminBridge.dll"
printf 'FROM munique/openmu\nCOPY MUnique.OpenMU.MuAdminBridge.dll /app/plugins/\nENV DOTNET_STARTUP_HOOKS=/app/plugins/MUnique.OpenMU.MuAdminBridge.dll\n' >"$T/Dockerfile"
docker build -q -t mu-openmu-admin "$T" >/dev/null

install -d -m 777 "$BRIDGE"
rm -f "$BRIDGE"/players.json "$BRIDGE"/disconnect
cat >docker-compose.bridge.yml <<YML
services:
  openmu:
    image: mu-openmu-admin
    volumes:
      - $BRIDGE:/mu-admin
YML
docker compose "${BASE[@]}" -f docker-compose.bridge.yml up -d openmu
echo "Esperando a que OpenMU arranque (hasta 3 minutos)..."
for _ in $(seq 1 90); do
  [ -s "$BRIDGE/players.json" ] && break
  sleep 2
done
restart_sidecars
if [ -s "$BRIDGE/players.json" ]; then echo "OK: el plugin está activo."; else echo "El plugin no escribió players.json. Revisa: docker logs openmu | tail -30  (o 'rollback')."; exit 1; fi
