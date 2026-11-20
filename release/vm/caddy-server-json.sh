#!/bin/sh
# En la VM (/opt/caddy/Caddyfile hecho a mano): el host del proxy (ws.*) responde /server.json con el archivo del
# cliente (nginx en :80) en vez de los valores por defecto de mu-proxy. El juego lee server.json de ese host
# (serverManifestUrl), asi que sin esto ve todo apagado. Idempotente; deja Caddyfile.bak-serverjson.
set -eu
F=/opt/caddy/Caddyfile
grep -q 'handle /server.json' "$F" && { echo "ya estaba"; exit 0; }
sudo cp "$F" "$F.bak-serverjson"
sudo python3 - "$F" <<'PY'
import re, sys
p = sys.argv[1]; s = open(p).read()
s = re.sub(r'(ws\.[^\s{]+ \{\n)\s*reverse_proxy 127\.0\.0\.1:8090\n\}',
           r'\1handle /server.json {\nheader Access-Control-Allow-Origin *\nheader Cache-Control no-cache\nreverse_proxy 127.0.0.1:80\n}\nhandle {\nreverse_proxy 127.0.0.1:8090\n}\n}', s, count=1)
open(p, 'w').write(s)
PY
sudo docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
echo listo
