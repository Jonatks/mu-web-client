set -e
sudo rm -rf /opt/openmu/web/client/assets
sudo unzip -oq ~/mu-web-update.zip -d /opt/openmu/web/client
sudo tee /opt/openmu/web/nginx.conf >/dev/null <<'EOC'
types { model/gltf-binary glb; }
include /etc/nginx/mime.types;
gzip on;
gzip_types text/css text/javascript application/javascript application/json;
server {
  listen 80;
  root /usr/share/nginx/html;
  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /preload-manifest.json { add_header Cache-Control "no-cache"; }
  location /game-assets/ { expires 30d; add_header Cache-Control "public, max-age=2592000, immutable"; }
  location /items/ { expires 30d; add_header Cache-Control "public, max-age=2592000, immutable"; }
  location /assets/ { expires 30d; add_header Cache-Control "public, max-age=2592000, immutable"; }
  location / { try_files $uri $uri/ /index.html; add_header Cache-Control "no-cache"; }
}
EOC
sudo docker restart web >/dev/null
sleep 2
curl -s -o /dev/null -w "sitio: HTTP %{http_code} (200 = abierto sin contraseña)\n" http://localhost/
curl -s -o /dev/null -w "manifest de carga: HTTP %{http_code}\n" http://localhost/preload-manifest.json
sudo docker ps --format "table {{.Names}}\t{{.Status}}"
