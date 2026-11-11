#!/bin/bash
# FASE 2d/5 - Se ejecuta EN LA VM. Copia diaria de la base de datos de OpenMU (Postgres), con retencion de 7 dias.
#   bash backup-db.sh install    # instala el temporizador diario (03:30) y hace una copia ahora
#   bash backup-db.sh run        # una copia ahora
#   bash backup-db.sh restore ARCHIVO.sql.gz   # restaura (DETIENE OpenMU un momento; pide confirmacion)
#   bash backup-db.sh uninstall
set -euo pipefail
DEST=/var/backups/mu-db
mkdir -p "$DEST" 2>/dev/null || sudo mkdir -p "$DEST"

# El contenedor de Postgres: el que usa la imagen postgres.
PG=$(sudo docker ps --format '{{.Names}} {{.Image}}' | awk '/postgres/{print $1; exit}')
[ -n "$PG" ] || { echo "no encuentro el contenedor de Postgres (docker ps)"; exit 1; }
USER_=$(sudo docker exec "$PG" printenv POSTGRES_USER 2>/dev/null || echo postgres)

run() {
  F="$DEST/openmu-$(date +%Y%m%d-%H%M%S).sql.gz"
  sudo docker exec "$PG" pg_dumpall -U "$USER_" | gzip -9 | sudo tee "$F" >/dev/null
  [ "$(stat -c %s "$F")" -gt 1000 ] || { echo "copia sospechosamente pequena: $F"; exit 1; }
  sudo find "$DEST" -name 'openmu-*.sql.gz' -mtime +7 -delete
  echo "copia lista: $F ($(du -h "$F" | cut -f1))"
}

case "${1:-run}" in
  run) run ;;
  install)
    sudo cp "$0" /usr/local/bin/mu-db-backup && sudo chmod 755 /usr/local/bin/mu-db-backup
    sudo tee /etc/systemd/system/mu-db-backup.service >/dev/null <<'EOS'
[Unit]
Description=Copia de la base de datos de OpenMU
[Service]
Type=oneshot
Nice=15
ExecStart=/usr/local/bin/mu-db-backup run
EOS
    sudo tee /etc/systemd/system/mu-db-backup.timer >/dev/null <<'EOS'
[Unit]
Description=Copia diaria de la base de datos de OpenMU
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
[Install]
WantedBy=timers.target
EOS
    sudo systemctl daemon-reload && sudo systemctl enable --now mu-db-backup.timer
    run ;;
  restore)
    F="${2:?indica el archivo .sql.gz}"
    read -r -p "Esto reemplaza TODA la base de datos con $F. Escribe SI para seguir: " A
    [ "$A" = "SI" ] || exit 1
    OM=$(sudo docker ps --format '{{.Names}}' | grep -i openmu | head -1 || true)
    [ -n "$OM" ] && sudo docker stop "$OM"
    gunzip -c "$F" | sudo docker exec -i "$PG" psql -U "$USER_" -d postgres >/dev/null
    [ -n "$OM" ] && sudo docker start "$OM"
    echo "restaurado" ;;
  uninstall) sudo systemctl disable --now mu-db-backup.timer ;;
esac
