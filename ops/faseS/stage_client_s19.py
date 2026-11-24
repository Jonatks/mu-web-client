# GS4: prepara los mundos del cliente S19 para la VM. Por cada WorldN/ObjectN compara con el arbol S6 y deja en
# <salida>/game-assets lo que cambio: terreno (con las copias jpg/tga que sirve el cliente; TerrainLight.OZB pasa a OZJ)
# y la lista de modelos .bmd a convertir con tools/bmdToGlb.ts. La salida va al repositorio privado mu-assets.
#   python3 ops/faseS/stage_client_s19.py <Data S19> <Data S6> <salida> <N> [<N> ...]
import hashlib, io, os, shutil, sys
from PIL import Image

s19, s6, out, worlds = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
md5 = lambda p: hashlib.md5(open(p, 'rb').read()).hexdigest()
lower = lambda d: {f.lower(): f for f in os.listdir(d)} if os.path.isdir(d) else {}

def derived(path):
    """The jpg / tga copies the client tree keeps next to an OZJ / OZT."""
    low = path.lower()
    if low.endswith('.ozj'):
        open(path[:-4] + '.jpg', 'wb').write(open(path, 'rb').read()[24:])
    elif low.endswith('.ozt'):
        open(path[:-4] + '.tga', 'wb').write(open(path, 'rb').read()[4:])

models = []
for n in worlds:
    for kind in ('World', 'Object'):
        a, b = f'{s19}/{kind}{n}', f'{s6}/{kind}{n}'
        new, old = lower(a), lower(b)
        dst = f'{out}/game-assets/{kind}{n}'
        for key, name in new.items():
            src = f'{a}/{name}'
            if os.path.isdir(src) or (key in old and md5(src) == md5(f'{b}/{old[key]}')):
                continue
            if key.endswith('.bmd'):
                models.append(f'{kind}{n}/{name}')
                continue
            os.makedirs(dst, exist_ok=True)
            if key == 'terrainlight.ozb' and 'terrainlight.ozj' in old:
                im = Image.open(io.BytesIO(open(src, 'rb').read()[4:])).convert('RGB')
                buf = io.BytesIO(); im.save(buf, 'JPEG', quality=95); jpg = buf.getvalue()
                target = f'{dst}/{old["terrainlight.ozj"]}'
                open(target, 'wb').write(jpg[:24] + jpg)
                derived(target)
                continue
            target = f'{dst}/{old.get(key, name)}'
            shutil.copyfile(src, target)
            derived(target)
open(f'{out}/models.txt', 'w').write('\n'.join(models) + '\n')
print('modelos a convertir:', len(models))
