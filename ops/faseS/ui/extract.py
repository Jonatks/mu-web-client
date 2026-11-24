# Recorta cada sub-imagen de cada GFx del S19 a <salida>/<GFx>/<id>.png y escribe <salida>/manifest.json.
import json, os, sys
from PIL import Image
import subs
gfxdir, dds, out = sys.argv[1:4]
manifest = {}; cache = {}; miss = set()
for f in sorted(os.listdir(gfxdir)):
    name = f[:-4]
    try: imgs, rects = subs.subs(f'{gfxdir}/{f}')
    except Exception as e: print('falla', f, e); continue
    entries = {}
    for cid, iid, x1, y1, x2, y2 in rects:
        fn = imgs.get(iid, (None,))[0]
        if not fn or not os.path.exists(f'{dds}/{fn}'): miss.add(fn); continue
        if fn not in cache: cache[fn] = Image.open(f'{dds}/{fn}').convert('RGBA')
        os.makedirs(f'{out}/{name}', exist_ok=True)
        cache[fn].crop((x1, y1, x2, y2)).save(f'{out}/{name}/{cid}.png', optimize=True)
        entries[cid] = [x2 - x1, y2 - y1]
    if entries: manifest[name] = entries
json.dump(manifest, open(f'{out}/manifest.json', 'w'), separators=(',', ':'))
print(len(manifest), 'ventanas', sum(len(v) for v in manifest.values()), 'piezas; faltan', sorted(m for m in miss if m)[:10])
