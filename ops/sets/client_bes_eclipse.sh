#!/bin/bash
# En la VM: copia Data/Local del cliente servido (/opt/openmu/web/client), aplica client_bes_eclipse.ts con bun y lo devuelve. Reversa: RESTORE=1.
set -euo pipefail
SHA=${SHA:?commit de mu-web-client}
W=/tmp/muset; rm -rf $W; mkdir -p $W/tools/clientData $W/src/controllers/terrain $W/src/core $W/ops/sets
R=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA
for f in tools/clientData/setFiles.ts src/controllers/terrain/mapFileEncryption.ts src/core/binaryUtils.ts ops/sets/client_bes_eclipse.ts; do curl -fsSL $R/$f -o $W/$f; done
C=/opt/openmu/web/client/Data/Local
sudo cp -a $C $W/Local
if [ "${RESTORE:-}" = 1 ]; then
  find $W/Local -name '*.bak' | while read b; do o=${b%.bak}; mv "$b" "$o"; [ -f "$o.gz" ] && gzip -9 -k -f "$o"; echo "restaurado $o"; done
else
  sudo docker run --rm -v $W:/w -w /w oven/bun:1.4.2-slim bun ops/sets/client_bes_eclipse.ts /w/Local
fi
sudo cp -a $W/Local/. $C/
echo listo
