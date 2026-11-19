#!/bin/sh
# Fase 0 en la VM: respalda la base, compila nuestros plugins sobre la imagen actual y recrea openmu.
# Si OpenMU no levanta sus puertos en 4 minutos, vuelve solo a la imagen anterior.
# Uso: sh deploy.sh <sha>     Volver a mano: sh deploy.sh rollback
set -eu
OLD=mu-openmu-admin:pre-fase0
recreate() {
  F=$(sudo docker inspect openmu --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' | tr ',' '\n' | sed 's/^/-f /' | tr '\n' ' ')
  (cd /opt/openmu && sudo docker compose $F up -d --no-deps --force-recreate openmu)
}
up() {
  for i in $(seq 1 48); do
    sudo docker logs --since "$1" openmu 2>&1 | grep -q 'ConnectServer.ClientListener\] Client Listener started' && return 0
    sleep 5
  done
  return 1
}
if [ "$1" = rollback ]; then sudo docker tag $OLD mu-openmu-admin:latest; recreate; echo "vuelto a $OLD"; exit 0; fi
SHA=$1
DIR=$(mktemp -d)
curl -fsSL "https://codeload.github.com/Jonatks/mu-web-client/tar.gz/$SHA" | tar -xz -C "$DIR" --strip-components=1 --wildcards '*/openmu/*' '*/ops/fase0/*'
if ! sudo docker image inspect $OLD >/dev/null 2>&1; then
  # La primera vez: la imagen sin nuestros plugins (si estaba la de la mezcla, su base).
  if sudo docker image inspect mu-openmu-admin:pre-craft >/dev/null 2>&1; then sudo docker tag mu-openmu-admin:pre-craft $OLD
  else sudo docker tag mu-openmu-admin:latest $OLD; fi
fi
if [ -x /usr/local/bin/mu-db-backup ]; then /usr/local/bin/mu-db-backup run; else
  B=/var/backups/mu-db/openmu-$(date +%Y%m%d-%H%M%S)-fase0.sql.gz; sudo mkdir -p /var/backups/mu-db
  sudo docker exec database pg_dumpall -U postgres | gzip -9 | sudo tee "$B" >/dev/null; echo "copia lista: $B"
fi
sudo docker build -q -f "$DIR/ops/fase0/Dockerfile" -t mu-openmu-admin:latest "$DIR/openmu"
T=$(date -u +%Y-%m-%dT%H:%M:%SZ)
recreate
rm -rf "$DIR"
if up "$T"; then echo "listo: OpenMU arriba con nuestros plugins"; else
  echo "OpenMU no levanto: vuelvo a $OLD"; sudo docker logs --since "$T" openmu 2>&1 | grep -i "error\|exception" | tail -5
  sudo docker tag $OLD mu-openmu-admin:latest; recreate; exit 1
fi
