#!/bin/bash
# Se ejecuta UNA vez EN LA VM. Limpia /etc/iptables/rules.v4 si "netfilter-persistent save" volco las reglas
# temporales de Docker (cadenas DOCKER*, tablas raw y nat, IPs de contenedores): deja solo la tabla filter
# de Oracle mas la regla del 8090. Guarda copia del archivo anterior.
set -euo pipefail
F=/etc/iptables/rules.v4
T=$(mktemp)
sudo cp -n "$F" "$F.antes-$(date +%Y%m%d%H%M)" || true
{
  echo "# Oracle filter + 8090 (proxy). Sin reglas de Docker: Docker las crea al arrancar."
  sudo awk '/^\*filter/{p=1} p&&!/DOCKER|docker0|br-/{print} /^COMMIT/{if(p)exit}' "$F" | sed 's/^:FORWARD DROP/:FORWARD ACCEPT/'
} >"$T"
sudo iptables-restore --test <"$T"
sudo install -m 644 "$T" "$F"
echo "--- $F ahora:"; sudo grep -nE "^\*|^COMMIT|8090|REJECT|dport 22|DOCKER|^:" "$F" | cut -c1-120
echo "lineas con DOCKER: $(sudo grep -c DOCKER "$F" || true)"
