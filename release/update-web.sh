set -e
sudo rm -rf /opt/openmu/web/client/assets
sudo unzip -oq ~/mu-web-update.zip -d /opt/openmu/web/client
# Precompresión (gzip -9) de modelos y texto: la carga baja ~4x. Se hace una sola vez por archivo.
echo "comprimiendo recursos (puede tardar unos minutos la primera vez)..."
sudo find /opt/openmu/web/client -type f \( -name '*.glb' -o -name '*.js' -o -name '*.json' -o -name '*.css' -o -name '*.wasm' -o -name '*.html' -o -name '*.tga' -o -name '*.TGA' -o -name '*.bmd' -o -name '*.svg' \) ! -name '*.gz' -size +1k -print0 | sudo xargs -0 -r -P 2 -I{} sh -c '[ -f "{}.gz" ] && [ "{}.gz" -nt "{}" ] || nice -n 10 gzip -9 -kf "{}"'
sudo tee /opt/openmu/web/nginx.conf >/dev/null <<'EOC'
types { model/gltf-binary glb; }
include /etc/nginx/mime.types;
gzip on;
gzip_static on;
gzip_vary on;
gzip_comp_level 5;
gzip_types text/css text/javascript application/javascript application/json image/svg+xml application/wasm model/gltf-binary application/octet-stream;
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
