#!/bin/bash
# Genera, desde TU cliente original de Windows, los assets que necesita el cliente web de Ignies
# (https://github.com/Ignies/OpenMu-Client-Babylon, licencia MIT + condicion de creditos, ver README.md).
# NO sube nada: los assets derivados de Webzen no van a ningun repo publico.
#
# Uso:  build-assets.sh "<ruta a MU Client 1.04d - Season 6E3/Data>" <ruta al clon de Ignies> [URL base de iconos]
# Requiere: bun, ffmpeg (con libvorbis), python3, el clon con "git sparse-checkout" (sin public/game-assets, packs, items, Data).
set -euo pipefail
DATA="${1:?ruta a Data del cliente original}"
REPO="${2:?ruta al clon de Ignies}"
ICONS_URL="${3:-}"            # p. ej. http://TU-VM/items/  (iconos pre-renderizados de tu propia VM)
export MU_DATA="$DATA"
cd "$REPO"

echo "== 1/5 texturas y modelos (herramientas de Ignies, leen MU_DATA)"
bun run tools/ozjToJpeg.ts >/dev/null     # escribe .jpg junto a cada .ozj en Data
bun run tools/oztToTga.ts  >/dev/null     # idem .tga
bun run tools/bmdToGlb.ts  >/dev/null     # public/game-assets/**.glb (167 .bmd son tablas cifradas: se ignoran, es normal)

echo "== 2/5 sonidos .wav -> .ogg (su cliente los pide en .ogg)"
OUT="$REPO/public/game-assets/Sound"; mkdir -p "$OUT"
(cd "$DATA/Sound" && find . -type f -iname '*.wav' -print0 | xargs -0 -P2 -I{} bash -c \
  'f="{}"; o="'"$OUT"'/${f%.*}.ogg"; mkdir -p "$(dirname "$o")"; ffmpeg -nostdin -loglevel error -y -i "$f" -c:a libvorbis -q:a 4 "$o"')

echo "== 3/5 terreno y texturas que su cliente espera dentro de game-assets (lista tomada de su repo)"
git ls-tree -r --name-only HEAD | grep '^public/game-assets/' > /tmp/ignies-ga.txt
python3 -I - "$DATA" "$REPO/public/game-assets" <<'PY'
import os, shutil, sys
D, OUT = sys.argv[1], sys.argv[2]
want = [l.strip()[len('public/game-assets/'):] for l in open('/tmp/ignies-ga.txt')]
want = [w for w in want if not w.lower().endswith(('.glb', '.ogg'))]
idx = {}
for r, _, fs in os.walk(D):
    for f in fs:
        idx[os.path.relpath(os.path.join(r, f), D).lower()] = os.path.join(r, f)
ok = 0
for w in want:
    s = idx.get(w.lower())
    if s:
        d = os.path.join(OUT, w); os.makedirs(os.path.dirname(d), exist_ok=True)
        if not os.path.exists(d): shutil.copyfile(s, d)
        ok += 1
print('copiados', ok, 'de', len(want), '(los que faltan son instrumentos del "sistema de banda" y 8 menores)')
PY

echo "== 4/5 tu Data tal cual bajo public/Data (Vite no sigue symlinks fuera de la raiz: copia con enlaces duros)"
[ -e public/Data ] || cp -al "$DATA" public/Data || cp -a "$DATA" public/Data
printf 'public/Data\npublic/game-assets/\npublic/items/\nnode_modules/\n' >> .git/info/exclude

echo "== 5/5 iconos de items (8128 PNG item_<grupo>_<num>_<tinte>.png)"
if [ -n "$ICONS_URL" ]; then
  mkdir -p public/items
  git ls-tree -r --name-only HEAD | grep '^public/items/' | sed 's#.*/##' > /tmp/ignies-icons.txt
  python3 -I - "$ICONS_URL" "$REPO/public/items" <<'PY'
import sys, os, urllib.request
from concurrent.futures import ThreadPoolExecutor
base, out = sys.argv[1], sys.argv[2]
names = [l.strip() for l in open('/tmp/ignies-icons.txt')]
def get(n):
    d = os.path.join(out, n)
    if os.path.exists(d): return 1
    try:
        with urllib.request.urlopen(base + n, timeout=30) as r:
            data = r.read(); ct = r.headers.get('content-type', '')
        if ct.startswith('image/png') and data[:4] == b'\x89PNG':   # nginx responde 200 con index.html si falta
            open(d, 'wb').write(data); return 1
    except Exception: pass
    return 0
with ThreadPoolExecutor(8) as ex: ok = sum(ex.map(get, names))
print('iconos', ok, 'de', len(names))
PY
fi
echo "Listo. Arranca:  PORT=8090 HOSTNAME=127.0.0.1 ALLOW_TARGETS=host:puerto,... bun run proxy/main.ts   y   APP_ENV=dev node_modules/.bin/vite --host 127.0.0.1"
