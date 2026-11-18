#!/bin/bash
# En la VM: copia Data/Local del cliente servido, aplica ops/bloodangel/client_sets.ts con bun y lo devuelve. Reversa: RESTORE=1 (usa los .bak3).
set -euo pipefail
SHA=${SHA:?commit de mu-web-client}
W=/tmp/mubset; sudo rm -rf $W; mkdir -p $W/tools/clientData $W/src/controllers/terrain $W/src/core $W/ops/sets $W/ops/bloodangel
R=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA
for f in tools/clientData/setFiles.ts src/controllers/terrain/mapFileEncryption.ts src/core/binaryUtils.ts ops/sets/classic_ancient.ts ops/bloodangel/client_sets.ts ops/bloodangel/gen_sets.ts ops/bloodangel/sets_s19.json; do curl -fsSL $R/$f -o $W/$f; done
C=/opt/openmu/web/client/Data/Local
sudo cp -a $C $W/Local
if [ "${RESTORE:-}" = 1 ]; then
  find $W/Local -name '*.bak3' | while read b; do o=${b%.bak3}; mv "$b" "$o"; [ -f "$o.gz" ] && gzip -9 -k -f "$o"; echo "restaurado $o"; done
else
  sudo docker run --rm -v $W:/w -w /w oven/bun:1.4.2-slim bun ops/bloodangel/client_sets.ts /w/Local
fi
sudo cp -a $W/Local/. $C/
echo listo
