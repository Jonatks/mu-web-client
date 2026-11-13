#!/bin/bash
# Se ejecuta EN LA VM. Prueba "Restablecer valores por defecto" contra una copia de la base (openmu_probe), nunca contra openmu.
#   SHA=<commit> bash check-on-vm.sh
# Restaura el respaldo mas nuevo en openmu_probe y ejecuta reset-check.ts en un contenedor desechable: cambia cosas, las restablece, las vuelve a restablecer y las deshace.
set -euo pipefail
SHA=${SHA:?SHA del commit}
RAW=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA/admin/service
DUMP=$(ls -t ~/backups/*.dump | head -1)
echo "respaldo: $DUMP"
sudo docker exec database psql -U postgres -qc 'drop database if exists openmu_probe' -c 'create database openmu_probe'
sudo docker exec -i database pg_restore -U postgres -d openmu_probe --no-owner < "$DUMP" 2>&1 | grep -v -i "already exists" | head -5 || true
T=$(mktemp -d)
for f in defaults.ts server.ts undo.ts errors.ts reset-check.ts package.json; do curl -fsSL "$RAW/$f" -o "$T/$f"; done
NET=$(sudo docker inspect mu-admin --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
URL=$(sudo docker inspect mu-admin --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^DATABASE_URL=' | cut -d= -f2- | sed 's#/openmu$#/openmu_probe#')
# contenedor desechable con bun; instala "postgres" al vuelo. Ve solo la copia de pruebas.
sudo docker run --rm --network "$NET" -v "$T":/w -v /var/lib/mu-admin/defaults.json.gz:/d/defaults.json.gz:ro -w /w -e ADMIN_DATA_DIR=/tmp/rc -e DATABASE_URL="$URL" oven/bun:1.4.2-slim sh -c 'bun install --silent >/dev/null 2>&1; bun run reset-check.ts /d/defaults.json.gz' 2>&1 | tail -40
echo "fin de la prueba"
