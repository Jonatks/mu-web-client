#!/bin/bash
# Se corre EN LA VM: pone como base de OpenMU la imagen con nuestros cambios (release openmu-<VERSION> de GitHub) y
# deja intacta la anterior como mu-openmu-admin:pre-fork. Despues hay que desplegar los plugins (deploy.sh <sha>),
# que se compilan sobre esta base y recrean openmu.
#   bash apply-vm.sh 0.10.1-mu1      aplica        bash apply-vm.sh rollback      vuelve a la base anterior
set -euo pipefail
if [ "${1:-}" = rollback ]; then
  sudo docker tag mu-openmu-admin:pre-fork mu-openmu-admin:pre-fase0
  echo "base anterior puesta; desplegar los plugins (deploy.sh <sha>) para usarla"; exit 0
fi
VERSION=${1:?version, p. ej. 0.10.1-mu1}
URL=https://github.com/Jonatks/mu-web-client/releases/download/openmu-$VERSION/openmu-$VERSION.tar.gz
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
curl -fsSL "$URL" -o "$T/openmu-$VERSION.tar.gz"
curl -fsSL "$URL.sha256" -o "$T/sum"
(cd "$T" && sha256sum -c sum)
sudo docker load -q -i "$T/openmu-$VERSION.tar.gz"
sudo docker image inspect mu-openmu-admin:pre-fork >/dev/null 2>&1 || sudo docker tag mu-openmu-admin:pre-fase0 mu-openmu-admin:pre-fork
# El puente del panel de administracion, tal como esta en la base anterior.
C=$(sudo docker create mu-openmu-admin:pre-fork)
sudo docker cp "$C:/app/plugins/MUnique.OpenMU.MuAdminBridge.dll" "$T/"
sudo docker rm "$C" >/dev/null
printf 'FROM openmu-mu:%s\nCOPY MUnique.OpenMU.MuAdminBridge.dll /app/plugins/\nENV DOTNET_STARTUP_HOOKS=/app/plugins/MUnique.OpenMU.MuAdminBridge.dll\n' "$VERSION" > "$T/Dockerfile"
sudo docker build -q -t mu-openmu-admin:pre-fase0 "$T" >/dev/null
echo "listo: base OpenMU $VERSION; falta desplegar los plugins (deploy.sh <sha>)"
