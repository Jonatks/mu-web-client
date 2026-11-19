#!/bin/bash
# Fase 0, punto 4, en la VM: comprueba sobre una copia que leer y reescribir los archivos de sets y recetas del
# cliente servido da archivos identicos. No cambia nada. Uso: SHA=<commit> bash roundtrip.sh
set -euo pipefail
SHA=${SHA:?commit de mu-web-client}
W=/tmp/muround; sudo rm -rf $W; mkdir -p $W/src/controllers/terrain $W/src/core $W/ops/bloodangel $W/tools/clientData
R=https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA
for f in src/controllers/terrain/mapFileEncryption.ts src/core/binaryUtils.ts ops/bloodangel/client_mix.ts tools/clientData/setFiles.ts tools/clientData/roundtrip.ts; do curl -fsSL $R/$f -o $W/$f; done
sudo cp -a /opt/openmu/web/client/Data/Local $W/Local
sudo docker run --rm -v $W:/w -w /w oven/bun:1.4.2-slim bun tools/clientData/roundtrip.ts /w/Local
sudo rm -rf $W
