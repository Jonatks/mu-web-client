#!/bin/sh
# Fase 3 en la VM: compila el plugin de craftings y cambia la imagen de OpenMU. Uso: sh deploy_craft.sh <sha>
# Rollback: sudo docker tag mu-openmu-admin:pre-craft mu-openmu-admin:latest y recrear el contenedor openmu.
set -eu
SHA=$1
DIR=$(mktemp -d)
curl -fsSL "https://codeload.github.com/Jonatks/mu-web-client/tar.gz/$SHA" | tar -xz -C "$DIR" --strip-components=1 --wildcards '*/openmu/*' '*/ops/bloodangel/Dockerfile.craft'
sudo docker image inspect mu-openmu-admin:pre-craft >/dev/null 2>&1 || sudo docker tag mu-openmu-admin:latest mu-openmu-admin:pre-craft
sudo docker build -q -f "$DIR/ops/bloodangel/Dockerfile.craft" -t mu-openmu-admin:latest "$DIR/openmu"
F=$(sudo docker inspect openmu --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' | tr ',' '\n' | sed 's/^/-f /' | tr '\n' ' ')
cd /opt/openmu
sudo docker compose $F up -d --no-deps openmu
rm -rf "$DIR"
echo listo
