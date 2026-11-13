#!/bin/bash
# Genera los valores por defecto de OpenMU para el boton "Restablecer valores por defecto".
#   bash export-defaults.sh            # en un equipo con podman o docker y 2 GB libres (Cloud Shell sirve)
# Arranca una copia nueva de OpenMU con su propia base vacia (sin puertos), espera a que se inicialice, guarda sus datos
# en ./defaults.json.gz y la borra. No toca el juego ni la base openmu. La VM de 1 GB no alcanza para esto.
# Despues: scp defaults.json.gz a la VM y ponerlo en /var/lib/mu-admin/defaults.json.gz (ver docs/admin_web.md).
set -euo pipefail

OUT=${OUT:-$PWD/defaults.json.gz}
C=$(command -v podman || command -v docker)
PW=$(head -c 24 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 20)

cleanup() {
  "$C" logs --tail 15 defmu > defmu.log 2>&1 || true
  "$C" rm -fv defmu defdb >/dev/null 2>&1 || true
  "$C" network rm defnet >/dev/null 2>&1 || true
}
trap cleanup EXIT

"$C" rm -fv defmu defdb >/dev/null 2>&1 || true
"$C" network create defnet >/dev/null 2>&1 || true
"$C" run -d --name defdb --network defnet -e POSTGRES_PASSWORD="$PW" -e POSTGRES_DB=openmu docker.io/library/postgres:18 >/dev/null
sleep 15
"$C" run -d --name defmu --network defnet -e DB_HOST=defdb -e DB_ADMIN_USER=postgres -e DB_ADMIN_PW="$PW" -e ASPNETCORE_URLS=http://+:8080 docker.io/munique/openmu >/dev/null

count() { "$C" exec defdb psql -U postgres -d openmu -Atc 'select count(*) from config."MonsterSpawnArea"' 2>/dev/null || echo 0; }
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
"$C" exec -i defdb psql -U postgres -d openmu -At <<SQL | gzip -9 > "$OUT"
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
ls -la "$OUT"
echo "listo: valores por defecto guardados en $OUT"
