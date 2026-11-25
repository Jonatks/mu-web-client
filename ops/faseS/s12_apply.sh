#!/bin/bash
# Fase S12 en la VM: un mapa nuevo del S19 (Acheron 91 primero). Servidor: s12_mapa<N>.sql de mu-assets, primero en
# openmu_probe; con PROD=1 tambien en openmu. Cliente: apply_client_s19.sh (terreno, objetos, monstruos, sonidos) y
# la fila de la ventana Move. Reversa: UNDO=1 (servidor) y RESTORE=1 (archivos Move).
#   SHA=<commit de mu-web-client> MAPA=91 bash s12_apply.sh
set -euo pipefail
SHA=${SHA:?commit de mu-web-client}; MAPA=${MAPA:-91}
A=~/mu-assets/s19/server/s12
GIT_SSH_COMMAND="ssh -i ~/.ssh/mu_assets -o IdentitiesOnly=yes" git -C ~/mu-assets pull -q
DBS=openmu_probe; [ "${PROD:-}" = 1 ] && DBS="openmu_probe openmu"
psql() { sudo docker exec -i database psql -U postgres -d "$1" -q -v ON_ERROR_STOP=1 "${@:2}"; }
for d in $DBS; do
  if [ "${UNDO:-}" = 1 ]; then psql $d < $A/s12_mapa${MAPA}_undo.sql; else psql $d < $A/s12_mapa${MAPA}.sql; fi
  echo "servidor $d listo"
done
C=/opt/openmu/web/client/Data
if [ "${RESTORE:-}" = 1 ]; then
  sudo find $C -name '*.bak12' | while read -r b; do o=${b%.bak12}; sudo mv "$b" "$o"; if [ -f "$o.gz" ]; then sudo gzip -9 -k -f "$o"; fi; echo "restaurado $o"; done
  exit 0
fi
[ "${UNDO:-}" = 1 ] && exit 0
[ -f ~/apply_client_s19.sh ] || curl -fsSL https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA/ops/faseS/apply_client_s19.sh -o ~/apply_client_s19.sh
bash ~/apply_client_s19.sh
W=/tmp/mus12; sudo rm -rf $W; mkdir -p $W/ops/faseS $W/src/controllers/terrain $W/src/core
R=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA
for f in ops/faseS/cliente_mapa.ts src/controllers/terrain/mapFileEncryption.ts src/core/binaryUtils.ts; do curl -fsSL $R/$f -o $W/$f; done
mkdir -p $W/Data && sudo cp -a $C/Local $W/Data/ && sudo find $C -maxdepth 1 -iname "gate.bmd*" -exec cp -a {} $W/Data/ \; && cp $A/s12_mapa${MAPA}_cliente.json $W/
sudo docker run --rm -v $W:/w -w /w oven/bun:1.4.2-slim bun ops/faseS/cliente_mapa.ts /w/Data /w/s12_mapa${MAPA}_cliente.json
sudo cp -a $W/Data/. $C/
echo "listo: reiniciar openmu para que cargue el mapa"
