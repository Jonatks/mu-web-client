#!/bin/bash
# Instala (o actualiza) el MCP de la VM. Se corre EN LA VM: bash install.sh <sha>    Quitar: bash install.sh quitar
# - Baja server.py de mu-web-client en <sha> a /opt/mu-mcp y lo corre como servicio (mu-mcp, 127.0.0.1:8770).
# - Agrega mcp.<host> al Caddy que ya sirve el 443 (https-caddy.sh): no abre puertos nuevos.
# - La primera vez pide la contrasena del conector (la escribe el dueno; queda solo su hash scrypt en
#   /etc/mu-mcp/password). Cambiarla: bash install.sh contrasena
# - Crea el rol de solo lectura mu_mcp_ro en openmu_probe y openmu para sql_consulta.
set -euo pipefail
HOST=155-181-133-84.sslip.io
MCP=mcp.$HOST
CADDY=/opt/caddy/Caddyfile

if [ "${1:-}" = quitar ]; then
  sudo systemctl disable --now mu-mcp 2>/dev/null || true
  sudo systemctl disable --now mu-mcp-vigia.timer 2>/dev/null || true
  sudo rm -f /etc/systemd/system/mu-mcp.service /etc/systemd/system/mu-mcp-vigia.service /etc/systemd/system/mu-mcp-vigia.timer
  sudo sed -i "/^# mu-mcp inicio/,/^# mu-mcp fin/d" $CADDY && sudo docker restart caddy >/dev/null
  echo "MCP quitado (quedan /opt/mu-mcp, /var/lib/mu-mcp y /etc/mu-mcp por si se quiere volver)"; exit 0
fi

set_password() {
  sudo mkdir -p /etc/mu-mcp
  read -rsp "Contrasena nueva para el conector (no se muestra): " P1; echo
  read -rsp "Repetirla: " P2; echo
  [ "$P1" = "$P2" ] && [ ${#P1} -ge 12 ] || { echo "No coinciden o tiene menos de 12 caracteres"; exit 1; }
  printf '%s' "$P1" | python3 -c 'import hashlib,os,sys; s=os.urandom(16); p=sys.stdin.read().encode(); print(s.hex()+":"+hashlib.scrypt(p,salt=s,n=2**15,r=8,p=1,maxmem=2**26).hex())' \
    | sudo tee /etc/mu-mcp/password >/dev/null
  sudo chown "$USER" /etc/mu-mcp/password; sudo chmod 600 /etc/mu-mcp/password
  unset P1 P2; echo "contrasena guardada (solo su hash)"
}
if [ "${1:-}" = contrasena ]; then set_password; sudo systemctl restart mu-mcp; exit 0; fi

SHA=${1:?commit de mu-web-client}
sudo apt-get install -y -q python3-venv >/dev/null
sudo mkdir -p /opt/mu-mcp /var/lib/mu-mcp && sudo chown "$USER" /opt/mu-mcp /var/lib/mu-mcp
curl -fsSL "https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA/ops/mcp/server.py" -o /opt/mu-mcp/server.py
[ -d /opt/mu-mcp/venv ] || python3 -m venv /opt/mu-mcp/venv
/opt/mu-mcp/venv/bin/pip install -q 'mcp==2.3.0' 'uvicorn>=0.30'
[ -f /etc/mu-mcp/password ] || set_password

# Rol de solo lectura para sql_consulta (sin contrasena: solo se entra desde dentro del contenedor).
for d in openmu_probe openmu; do
  sudo docker exec -i database psql -U postgres -d $d -q -v ON_ERROR_STOP=1 >/dev/null <<SQL
do \$\$ begin if not exists (select from pg_roles where rolname = 'mu_mcp_ro') then create role mu_mcp_ro login; end if; end \$\$;
alter role mu_mcp_ro set default_transaction_read_only = on;
grant connect on database $d to mu_mcp_ro;
select format('grant usage on schema %I to mu_mcp_ro; grant select on all tables in schema %I to mu_mcp_ro; alter default privileges in schema %I grant select on tables to mu_mcp_ro;', n, n, n)
  from pg_namespace, lateral (select nspname as n) x where nspname not like 'pg\_%' and nspname <> 'information_schema' \\gexec
SQL
done

sudo tee /etc/systemd/system/mu-mcp.service >/dev/null <<EOF
[Unit]
Description=MCP de la VM de MU (conector de Claude)
After=network-online.target docker.service
# Nunca deja de reintentar (por defecto systemd se rinde tras 5 fallas en 10 s).
StartLimitIntervalSec=0

[Service]
User=$USER
Environment=MU_MCP_HOME=$HOME
ExecStart=/opt/mu-mcp/venv/bin/python /opt/mu-mcp/server.py
Restart=always
RestartSec=3
MemoryMax=256M
# Usa ~60 MB: ante falta de memoria, Linux elige otros procesos antes que este.
OOMScoreAdjust=-800

[Install]
WantedBy=multi-user.target
EOF
# Vigilante: cada minuto pide /salud y, si no responde en 10 s, reinicia el servicio.
sudo tee /etc/systemd/system/mu-mcp-vigia.service >/dev/null <<'UNIT'
[Unit]
Description=Reinicia mu-mcp si no responde

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'curl -fsS --max-time 10 http://127.0.0.1:8770/salud >/dev/null || { logger -t mu-mcp-vigia "sin respuesta, reinicio"; systemctl restart mu-mcp; }'
UNIT
sudo tee /etc/systemd/system/mu-mcp-vigia.timer >/dev/null <<'UNIT'
[Unit]
Description=Vigila mu-mcp cada minuto

[Timer]
OnBootSec=2min
OnUnitActiveSec=1min

[Install]
WantedBy=timers.target
UNIT
sudo systemctl daemon-reload && sudo systemctl enable -q mu-mcp && sudo systemctl restart mu-mcp
sudo systemctl enable -q --now mu-mcp-vigia.timer

if ! sudo grep -q '^# mu-mcp inicio' $CADDY; then
  printf '# mu-mcp inicio\n%s {\n  reverse_proxy 127.0.0.1:8770\n}\n# mu-mcp fin\n' "$MCP" | sudo tee -a $CADDY >/dev/null
  sudo docker restart caddy >/dev/null
fi
echo "esperando el certificado de $MCP (hasta 90 s)..."
for i in $(seq 1 18); do
  if curl -fsS --max-time 6 "https://$MCP/salud" >/dev/null 2>&1; then
    echo "OK. En Claude: Personalizar > Conectores > + > Agregar conector personalizado, URL https://$MCP/mcp"
    exit 0
  fi
  sleep 5
done
echo "No responde todavia: sudo journalctl -u mu-mcp -n 30 ; sudo docker logs caddy --tail 20"; exit 1
