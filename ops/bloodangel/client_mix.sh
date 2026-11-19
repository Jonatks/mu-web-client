#!/bin/bash
# En la VM: aplica client_mix.ts al Mix.bmd del cliente servido. Uso: SHA=<commit> [NAME=<GlobalText id>] bash client_mix.sh
# Reversa: RESTORE=1 (usa mix.bmd.bak3).
set -euo pipefail
SHA=${SHA:?commit de mu-web-client}
W=/tmp/mubmix; sudo rm -rf $W; mkdir -p $W/src/controllers/terrain $W/src/core $W/ops/bloodangel
R=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA
for f in src/controllers/terrain/mapFileEncryption.ts src/core/binaryUtils.ts ops/bloodangel/client_mix.ts; do curl -fsSL $R/$f -o $W/$f; done
C=/opt/openmu/web/client/Data/Local
sudo cp -a $C $W/Local
if [ "${RESTORE:-}" = 1 ]; then
  find $W/Local -iname 'mix.bmd.bak3' | while read b; do o=${b%.bak3}; mv "$b" "$o"; [ -f "$o.gz" ] && gzip -9 -k -f "$o"; echo "restaurado $o"; done
else
  sudo docker run --rm -v $W:/w -w /w oven/bun:1.4.2-slim bun ops/bloodangel/client_mix.ts /w/Local "${NAME:-0}"
fi
sudo cp -a $W/Local/. $C/
echo listo
