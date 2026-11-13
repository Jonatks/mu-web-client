#!/bin/bash
# Se ejecuta EN LA VM. Prueba "Restablecer valores por defecto" contra una copia de la base (openmu_probe), nunca contra openmu.
#   SHA=<commit> bash check-on-vm.sh
# Restaura el respaldo mas nuevo en openmu_probe, copia el codigo del commit al contenedor mu-admin (solo su disco, el servicio sigue igual)
# y ejecuta reset-check.ts: cambia cosas, las restablece, las vuelve a restablecer y las deshace.
set -euo pipefail
SHA=${SHA:?SHA del commit}
RAW=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA/admin/service
DUMP=$(ls -t ~/backups/*.dump | head -1)
echo "respaldo: $DUMP"
sudo docker exec database psql -U postgres -qc 'drop database if exists openmu_probe' -c 'create database openmu_probe'
sudo docker exec -i database pg_restore -U postgres -d openmu_probe --no-owner < "$DUMP" 2>&1 | grep -v -i "already exists" | head -5 || true
T=$(mktemp -d)
for f in defaults.ts server.ts app.ts reset-check.ts; do curl -fsSL "$RAW/$f" -o "$T/$f"; done
sudo docker exec mu-admin mkdir -p /tmp/rc/chk
for f in defaults.ts server.ts reset-check.ts; do sudo docker cp "$T/$f" mu-admin:/app/admin/service/$f.new; done
sudo docker exec mu-admin sh -c 'cd /app/admin/service && for f in defaults.ts reset-check.ts; do cp "$f.new" "$f"; done && cp server.ts server.ts.bak && cp server.ts.new server.ts'
sudo docker exec mu-admin sh -c 'export DATABASE_URL=$(echo "$DATABASE_URL" | sed "s#/openmu\$#/openmu_probe#"); export ADMIN_DATA_DIR=/tmp/rc; cd /app/admin/service && bun run reset-check.ts /var/lib/mu-admin/defaults.json.gz' 2>&1 | tail -40
# deja el contenedor como estaba
sudo docker exec mu-admin sh -c 'cd /app/admin/service && mv server.ts.bak server.ts && rm -f defaults.ts reset-check.ts *.new'
echo "fin de la prueba"
