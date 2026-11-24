#!/bin/bash
# Fase GS4 en la VM: copia lo del cliente S19 (repositorio privado mu-assets, carpeta s19/client) sobre el cliente
# servido, guardando cada archivo anterior como .bak-s6 (y su .gz, que nginx serviria en su lugar).
#   bash apply_client_s19.sh          aplica      bash apply_client_s19.sh rollback   vuelve a lo de antes
set -eu
WEB=/opt/openmu/web/client
SRC=~/mu-assets/s19/client
if [ "${1:-}" = rollback ]; then
  sudo find "$WEB/Data" "$WEB/game-assets" -name '*.bak-s6' | while read -r b; do sudo mv "$b" "${b%.bak-s6}"; done
  sudo find "$WEB/Data" "$WEB/game-assets" -name '*.s19-new' | while read -r m; do sudo rm -f "${m%.s19-new}" "$m"; done
  echo "vuelto a S6"; exit 0
fi
(cd ~/mu-assets && GIT_SSH_COMMAND="ssh -i ~/.ssh/mu_assets -o IdentitiesOnly=yes" git pull -q)
for top in Data game-assets; do
  (cd "$SRC/$top" && find . -type f) | while read -r f; do
    dst="$WEB/$top/${f#./}"
    sudo mkdir -p "$(dirname "$dst")"
    if [ -f "$dst" ] && [ ! -f "$dst.bak-s6" ]; then sudo cp -p "$dst" "$dst.bak-s6"; fi
    if [ ! -f "$dst" ]; then sudo touch "$dst.s19-new"; fi
    if [ -f "$dst.gz" ]; then sudo mv "$dst.gz" "$dst.gz.bak-s6"; fi
    sudo cp "$SRC/$top/${f#./}" "$dst"
  done
done
echo "listo: $(cd "$SRC" && find . -type f | wc -l) archivos del S19 en el cliente"
