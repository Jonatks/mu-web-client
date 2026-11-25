#!/bin/bash
# Fase S10 en la VM: items Mastery Darkangel a Lightning (servidor y cliente) y sus sets.
# Primero en openmu_probe; con PROD=1 tambien en openmu. Reversa: UNDO=1 (servidor) y RESTORE=1 (archivos de sets).
#   SHA=<commit de mu-web-client> bash s10_apply.sh
set -euo pipefail
SHA=${SHA:?commit de mu-web-client}
A=~/mu-assets/s19/server/s10
GIT_SSH_COMMAND="ssh -i ~/.ssh/mu_assets -o IdentitiesOnly=yes" git -C ~/mu-assets pull -q
DBS=openmu_probe; [ "${PROD:-}" = 1 ] && DBS="openmu_probe openmu"
psql() { sudo docker exec -i database psql -U postgres -d "$1" -q -v ON_ERROR_STOP=1 "${@:2}"; }
for d in $DBS; do
  if [ "${UNDO:-}" = 1 ]; then
    psql $d -v undo=1 < $A/s10_sets.sql; psql $d < $A/s10_mastery_undo.sql
  else
    psql $d < $A/s10_mastery.sql; psql $d < $A/s10_sets.sql
  fi
  echo "servidor $d listo"
done
# Cliente: los modelos van con apply_client_s19.sh (game-assets/Item); los sets en Data/Local, como client_sets.sh.
W=/tmp/mus10; sudo rm -rf $W; mkdir -p $W/tools/clientData $W/src/controllers/terrain $W/src/core $W/ops/sets $W/ops/bloodangel $W/ops/faseS
R=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA
for f in tools/clientData/setFiles.ts src/controllers/terrain/mapFileEncryption.ts src/core/binaryUtils.ts ops/sets/classic_ancient.ts \
  ops/bloodangel/client_sets.ts ops/bloodangel/gen_sets.ts ops/bloodangel/sets_s19.json ops/bloodangel/sets.sql ops/faseS/gen_mastery_sets.ts; do
  curl -fsSL $R/$f -o $W/$f
done
cp -r $A/gens $W/gens
C=/opt/openmu/web/client/Data/Local
sudo cp -a $C $W/Local
if [ "${RESTORE:-}" = 1 ]; then
  find $W/Local -name '*.bak10' | while read -r b; do o=${b%.bak10}; mv "$b" "$o"; [ -f "$o.gz" ] && gzip -9 -k -f "$o"; echo "restaurado $o"; done
else
  sudo docker run --rm -v $W:/w -w /w oven/bun:1.4.2-slim bun ops/faseS/gen_mastery_sets.ts client /w/gens /w/Local
fi
sudo cp -a $W/Local/. $C/
echo "listo: reiniciar openmu para que lea los items y sets"
