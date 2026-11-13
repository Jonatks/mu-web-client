#!/bin/bash
# Se ejecuta EN LA VM. Genera los valores por defecto de OpenMU para el boton "Restablecer valores por defecto".
#   bash export-defaults.sh
# Arranca una copia nueva de OpenMU (base vacia propia, sin puertos) hasta que se inicializa, guarda sus datos en
# /var/lib/mu-admin/defaults.json.gz y la borra. El juego se detiene durante ese tiempo (unos 4 minutos) y siempre
# vuelve a arrancar, aunque algo falle. No toca la base openmu.
set -euo pipefail

OUT=${OUT:-/var/lib/mu-admin/defaults.json.gz}
NET=$(sudo docker inspect openmu --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
PW=$(head -c 24 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 20)
DOT=$(sudo docker inspect openmu --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^DOTNET_' | sed 's/^/-e /' | tr '\n' ' ')

cleanup() {
  sudo docker rm -fv defmu defdb >/dev/null 2>&1 || true
  sudo docker start openmu >/dev/null 2>&1 || true
}
trap cleanup EXIT

sudo docker rm -fv defmu defdb >/dev/null 2>&1 || true
sudo docker stop openmu >/dev/null
sudo docker run -d --name defdb --network "$NET" --memory 256m -e POSTGRES_PASSWORD="$PW" -e POSTGRES_DB=openmu postgres:18 -c shared_buffers=48MB -c max_connections=40 >/dev/null
sleep 12
# shellcheck disable=SC2086
sudo docker run -d --name defmu --network "$NET" --memory 560m $DOT -e DB_HOST=defdb -e DB_ADMIN_USER=postgres -e DB_ADMIN_PW="$PW" -e ASPNETCORE_URLS=http://+:8080 munique/openmu >/dev/null

count() { sudo docker exec defdb psql -U postgres -d openmu -Atc 'select count(*) from config."MonsterSpawnArea"' 2>/dev/null || echo 0; }
echo "esperando que OpenMU inicialice la base..."
last=-1; stable=0
for _ in $(seq 1 120); do
  n=$(count)
  if [ "${n:-0}" -gt 0 ] && [ "$n" = "$last" ]; then stable=$((stable + 1)); else stable=0; fi
  last=$n
  [ "$stable" -ge 3 ] && break
  sleep 10
done
[ "${last:-0}" -gt 0 ] || { echo "la base nueva no se inicializo"; exit 1; }

STORES='select "MerchantStoreId" from config."MonsterDefinition" where "MerchantStoreId" is not null'
ITEMS="select \"Id\" from data.\"Item\" where \"ItemStorageId\" in ($STORES)"
sudo docker exec -i defdb psql -U postgres -d openmu -At <<SQL | gzip -9 | sudo tee "$OUT" >/dev/null
select jsonb_build_object(
 'GameConfiguration', (select jsonb_agg(to_jsonb(t)) from config."GameConfiguration" t),
 'GameServerDefinition', (select jsonb_agg(to_jsonb(t)) from config."GameServerDefinition" t),
 'GameServerConfiguration', (select jsonb_agg(to_jsonb(t)) from config."GameServerConfiguration" t),
 'GameMapDefinition', (select jsonb_agg(to_jsonb(t) - 'TerrainData') from config."GameMapDefinition" t),
 'MonsterSpawnArea', (select jsonb_agg(to_jsonb(t)) from config."MonsterSpawnArea" t),
 'MonsterDefinition', (select jsonb_agg(to_jsonb(t)) from config."MonsterDefinition" t),
 'MonsterAttribute', (select jsonb_agg(to_jsonb(t)) from config."MonsterAttribute" t),
 'DropItemGroup', (select jsonb_agg(to_jsonb(t)) from config."DropItemGroup" t),
 'ItemDropItemGroup', (select jsonb_agg(to_jsonb(t)) from config."ItemDropItemGroup" t),
 'MiniGameDefinition', (select jsonb_agg(to_jsonb(t)) from config."MiniGameDefinition" t),
 'WarpInfo', (select jsonb_agg(to_jsonb(t)) from config."WarpInfo" t),
 'PlugInConfiguration', (select jsonb_agg(to_jsonb(t)) from config."PlugInConfiguration" t),
 'stores', (select jsonb_agg(jsonb_build_object('Number', "Number", 'Store', "MerchantStoreId")) from config."MonsterDefinition" where "MerchantStoreId" is not null),
 'Item', (select jsonb_agg(to_jsonb(t)) from data."Item" t where t."ItemStorageId" in ($STORES)),
 'ItemOptionLink', (select jsonb_agg(to_jsonb(t)) from data."ItemOptionLink" t where t."ItemId" in ($ITEMS)),
 'ItemItemOfItemSet', (select jsonb_agg(to_jsonb(t)) from data."ItemItemOfItemSet" t where t."ItemId" in ($ITEMS))
);
SQL
sudo chmod 644 "$OUT"
ls -la "$OUT"
echo "listo: valores por defecto guardados"
