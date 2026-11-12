#!/bin/bash
# Se ejecuta EN LA VM. Reversible. Instala el servicio de administracion (unico codigo que toca los datos de OpenMU).
#   bash install-vm.sh             # instala o actualiza contra la base $DB (por defecto openmu)
#   DB=openmu_probe bash install-vm.sh   # prueba contra la copia de pruebas
#   bash install-vm.sh rollback    # quita el contenedor y la ruta de Caddy (la clave y el rol quedan)
# La clave se genera aqui, en /etc/mu-admin/key (solo root). Este script no la imprime nunca.
set -euo pipefail

DB=${DB:-openmu}
BRANCH=${BRANCH:-admin}
HOST=155-181-133-84.sslip.io
APP=/opt/mu-admin
CFG=/etc/mu-admin
DATA=/var/lib/mu-admin
CADDY=/opt/caddy/Caddyfile

write_caddy() {
  local with_admin=$1
  sudo tee "$CADDY" >/dev/null <<CF
{
  auto_https disable_redirects
}
$HOST {
  encode zstd gzip
$( [ "$with_admin" = 1 ] && printf '  handle /_admin/* {\n    uri strip_prefix /_admin\n    reverse_proxy 127.0.0.1:3200\n  }\n  handle {\n    reverse_proxy 127.0.0.1:80\n  }' || printf '  reverse_proxy 127.0.0.1:80' )
}
ws.$HOST {
  reverse_proxy 127.0.0.1:8090
}
CF
  sudo docker exec caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null
}

if [ "${1:-}" = "rollback" ]; then
  sudo docker rm -f mu-admin mu-gate mu-kick >/dev/null 2>&1 || true
  write_caddy 0
  echo "mu-admin quitado y ruta /_admin fuera de Caddy"
  exit 0
fi

command -v docker >/dev/null || { echo "falta docker"; exit 1; }
sudo docker ps --format '{{.Names}}' | grep -qx database || { echo "no encuentro el contenedor database"; exit 1; }
sudo install -d -m 700 "$CFG" "$DATA"

# Clave larga (solo si no existe) y clave del rol de base de datos.
[ -s "$CFG/key" ] || { head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n' | sudo tee "$CFG/key" >/dev/null; sudo chmod 600 "$CFG/key"; }
[ -s "$CFG/db-password" ] || { head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n' | sudo tee "$CFG/db-password" >/dev/null; sudo chmod 600 "$CFG/db-password"; }

# Rol con lo minimo: leer data/config y escribir solo las tablas que el servicio edita.
PW=$(sudo cat "$CFG/db-password")
sudo docker exec -i database psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -v pw="$PW" -q <<'SQL' >/dev/null
SELECT format('CREATE ROLE mu_admin LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', :'pw')
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mu_admin') \gexec
SELECT format('ALTER ROLE mu_admin PASSWORD %L', :'pw') \gexec
GRANT USAGE ON SCHEMA data, config TO mu_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA data, config TO mu_admin;
GRANT INSERT, UPDATE ON data."Account" TO mu_admin;
GRANT INSERT, UPDATE, DELETE ON data."Character", data."StatAttribute", data."SkillEntry" TO mu_admin;
GRANT DELETE ON data."Account" TO mu_admin;
GRANT INSERT, UPDATE, DELETE ON data."ItemStorage" TO mu_admin;
GRANT INSERT, UPDATE, DELETE ON data."Item", data."ItemOptionLink", data."ItemItemOfItemSet" TO mu_admin;
GRANT INSERT, UPDATE, DELETE ON data."AccountCharacterClass", data."CharacterQuestState", data."QuestMonsterKillRequirementState", data."GensMember", data."LetterHeader", data."LetterBody", data."CashShopStorageItem" TO mu_admin;
SQL

# Codigo: el repo es publico.
if [ -d "$APP/.git" ]; then sudo git -C "$APP" fetch -q origin "$BRANCH" && sudo git -C "$APP" reset -q --hard "origin/$BRANCH"; else sudo git clone -q --depth 1 -b "$BRANCH" https://github.com/Jonatks/mu-web-client "$APP"; fi
sudo docker run --rm -v "$APP/admin/service":/s -w /s oven/bun:1.4.2-slim bun install --frozen-lockfile --ignore-scripts >/dev/null

printf 'DATABASE_URL=postgres://mu_admin:%s@database:5432/%s\n' "$PW" "$DB" | sudo tee "$CFG/env" >/dev/null
sudo chmod 600 "$CFG/env"

# Quien esta conectado: un contenedor pequeno comparte la red de OpenMU y escribe cada 2 s cuantos sockets hay en los puertos de juego.
sudo docker rm -f mu-gate >/dev/null 2>&1 || true
sudo docker run -d --name mu-gate --restart unless-stopped --network container:openmu --memory 40m \
  -v "$APP":/app:ro -v "$DATA":/var/lib/mu-admin -w /app/admin/service oven/bun:1.4.2-slim bun gate-sidecar.ts >/dev/null
# Desconectar jugadores desde el panel: otro contenedor pequeno, con permiso solo de red, corta los sockets de los puertos de juego.
sudo docker rm -f mu-kick >/dev/null 2>&1 || true
sudo docker run -d --name mu-kick --restart unless-stopped --network container:openmu --cap-add NET_ADMIN --memory 24m \
  -v "$APP":/app:ro -v "$DATA":/d alpine sh /app/admin/service/kick-sidecar.sh >/dev/null
sudo docker rm -f mu-admin >/dev/null 2>&1 || true
sudo docker run -d --name mu-admin --restart unless-stopped --network openmu_default --memory 80m \
  -p 127.0.0.1:3200:3200 --env-file "$CFG/env" -e ADMIN_KEY_FILE=/run/key \
  -v "$APP":/app:ro -v "$CFG/key":/run/key:ro -v "$DATA":/var/lib/mu-admin \
  -w /app/admin/service oven/bun:1.4.2-slim bun main.ts >/dev/null
sleep 3

# Ruta publica por el Caddy (HTTPS). Si el sitio deja de abrir, se deshace sola.
[ -f "$CADDY.antes" ] || sudo cp "$CADDY" "$CADDY.antes"
write_caddy 1
sleep 2
if curl -fsS --max-time 8 -o /dev/null "https://$HOST/" && curl -fsS --max-time 8 "https://$HOST/_admin/health" | grep -q '"ok":true'; then
  echo "OK: https://$HOST/_admin/health responde. Base: $DB"
  echo "Clave para Vercel (MU_ADMIN_KEY): sudo cat $CFG/key   (copiala tu desde esta terminal, no la pegues en chats)"
else
  echo "FALLO: se deshace la ruta de Caddy"
  write_caddy 0
  sudo docker logs mu-admin --tail 20
  exit 1
fi
