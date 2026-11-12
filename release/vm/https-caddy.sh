#!/bin/bash
# FASE 2b - Se ejecuta EN LA VM. Reversible. HTTPS y wss:// gratis, sin comprar dominio.
#
# Usa el nombre 155-181-133-84.sslip.io (y ws.155-181-133-84.sslip.io), que apuntan solos a la IP de la VM, y un Caddy que
# obtiene el certificado de Let's Encrypt. Caddy escucha SOLO en el 443 (el 80 sigue siendo del nginx del contenedor `web`);
# el certificado se pide por TLS-ALPN, que no necesita el 80.
#   https://155-181-133-84.sslip.io      -> la web (nginx en 127.0.0.1:80)
#   wss://ws.155-181-133-84.sslip.io     -> el proxy endurecido (127.0.0.1:8090)
#
# REQUISITO (lo hace el propietario en la consola de Oracle, es gratis): en la Security List de la subred agregar una regla de
# entrada TCP 443 desde 0.0.0.0/0. El firewall de la VM lo abre este script.
#
#   bash https-caddy.sh            # instala
#   bash https-caddy.sh rollback   # quita Caddy y cierra el 443
set -euo pipefail

HOST=155-181-133-84.sslip.io
CFG=/opt/caddy

if [ "${1:-}" = "rollback" ]; then
  sudo docker rm -f caddy >/dev/null 2>&1 || true
  sudo iptables -D INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
  sudo sed -i '\#^-A INPUT -p tcp -m tcp --dport 443 -j ACCEPT$#d' /etc/iptables/rules.v4
  echo "Caddy quitado y 443 cerrado en el firewall de la VM"
  exit 0
fi

sudo mkdir -p "$CFG/data" "$CFG/config"
sudo tee "$CFG/Caddyfile" >/dev/null <<EOF
{
  # El puerto 80 es del nginx: ni redireccion ni desafio HTTP.
  auto_https disable_redirects
}
$HOST {
  encode zstd gzip
  reverse_proxy 127.0.0.1:80
}
ws.$HOST {
  reverse_proxy 127.0.0.1:8090
}
EOF

# Oracle Ubuntu trae iptables con REJECT al final: el 443 se inserta antes.
sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
# Se persiste editando rules.v4: "netfilter-persistent save" volcaria tambien las reglas temporales de Docker.
RULE="-A INPUT -p tcp -m tcp --dport 443 -j ACCEPT"
sudo grep -qxF -- "$RULE" /etc/iptables/rules.v4 || sudo sed -i "/^-A INPUT -j REJECT --reject-with icmp-host-prohibited/i $RULE" /etc/iptables/rules.v4

sudo docker rm -f caddy >/dev/null 2>&1 || true
sudo docker run -d --name caddy --restart unless-stopped --network host --memory 96m \
  -v "$CFG/Caddyfile":/etc/caddy/Caddyfile:ro -v "$CFG/data":/data -v "$CFG/config":/config \
  caddy:2-alpine >/dev/null

echo "esperando el certificado (hasta 90 s)..."
for i in $(seq 1 18); do
  if curl -fsS -o /dev/null --max-time 6 "https://$HOST/"; then
    echo "OK: https://$HOST abre con candado"
    echo "Siguiente: en serverlist.md usar  (155.181.133.84:44405@wss://ws.$HOST)  y publicar por la rama release."
    exit 0
  fi
  sleep 5
done
echo "No hay certificado todavia. Causas tipicas: el 443 no esta abierto en la Security List de Oracle, o el DNS de sslip.io."
echo "Registro: sudo docker logs caddy --tail 30.  Revertir: bash $0 rollback"
exit 1
