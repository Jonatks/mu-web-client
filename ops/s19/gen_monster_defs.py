# Fase S12: las carpetas del cliente (versions/shared/monsters/<nombre>/index.ts) de los monstruos nuevos del S19,
# desde monster_models.tsv y el MonsterList.xml del servidor S19. No pisa una carpeta que ya existe.
#   python3 ops/s19/gen_monster_defs.py "<Data/Monster del servidor S19>" 581-597 [608-615 ...]
import csv, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MONSTERS = os.path.join(ROOT, 'versions/shared/monsters')
# Object.Scale por numero, cuando el modelo a 1.0 no queda del tamano del personaje (mirado en el juego).
SCALE = {}
CONF = {'alta': 'high', 'media': 'medium', 'baja': 'low'}


def s6_type(numb):
    for d in os.listdir(MONSTERS):
        f = os.path.join(MONSTERS, d, 'index.ts')
        if os.path.isfile(f):
            t = open(f).read()
            if re.search(rf'Numb: {numb},', t) and (m := re.search(r'model: \{ type: (\d+), scale: ([\d.]+)', t)):
                return int(m.group(1)), float(m.group(2))
    raise SystemExit(f'sin modelo Season 6 para {numb}')


def slug(name):
    return re.sub(r'_+', '_', re.sub(r'[^a-z0-9]+', '_', name.lower())).strip('_')


def main():
    src, ranges = sys.argv[1], sys.argv[2:]
    ids = set()
    for r in ranges:
        a, _, b = r.partition('-')
        ids.update(range(int(a), int(b or a) + 1))
    names = {}
    for m in re.finditer(r'<Monster ([^>]*)/>', open(os.path.join(src, 'MonsterList.xml'), encoding='utf-8').read()):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        names[int(a['ID'])] = (a['Name'].replace('&apos;', "'"), int(a['Life']))
    rows = csv.DictReader(open(os.path.join(ROOT, 'ops/s19/monster_models.tsv')), delimiter='\t')
    for row in rows:
        i = int(row['id'])
        if i not in ids or row['modelo'] == '?':
            continue
        name, life = names[i]
        folder = os.path.join(MONSTERS, slug(name))
        if os.path.exists(folder):
            folder = f'{folder}_{i}'
        if os.path.exists(folder):
            print('ya existe', folder); continue
        model = row['modelo']
        if model.startswith('s6:'):
            t, s = s6_type(int(model[3:]))
            draw = f'  model: {{ type: {t}, scale: {SCALE.get(i, s)} }},\n'
            src_note = f'the model of Season 6 monster {model[3:]}'
        elif model.startswith('NPC/'):
            draw = f"  npcModel: {{ file: '{model[4:-4]}' }},\n"
            src_note = f'Data/{model}'
        elif m := re.fullmatch(r'Monster/Monster(\d+)\.bmd', model):
            draw = f'  model: {{ type: {int(m.group(1)) - 1}, scale: {SCALE.get(i, 1)} }},\n'
            src_note = f'Data/{model}'
        else:
            print('modelo con nombre propio, falta soporte:', i, model); continue
        os.makedirs(folder)
        open(os.path.join(folder, 'index.ts'), 'w').write(
            "import { defineMonster } from '@/controllers/monsters';\n\n"
            'export default defineMonster({\n'
            f'  Numb: {i},\n'
            f"  Name: '{name.replace(chr(39), chr(92) + chr(39))}',\n"
            f'  // Season 19 (MonsterList {i}): {src_note}, ops/s19/monster_models.tsv ({CONF[row["confianza"]]}).\n'
            f'{draw}'
            f'  maxHealth: {life},\n'
            '});\n')
        print('ok', i, name, '->', os.path.relpath(folder, ROOT))


if __name__ == '__main__':
    main()
