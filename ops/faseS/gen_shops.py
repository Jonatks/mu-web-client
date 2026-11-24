# Fase S4: las tiendas de NPC del S19 (Shops/ShopList.xml y Shops/Scripts) como la tabla mu_plugins.s19_shop que lee el
# plugin S19Shops. Cada tienda va al NPC que la abre en MonsterSpawn.xml (NpcFunction = nombre de la tienda). Solo la
# pestana 1: OpenMU y el cliente tienen una sola pagina de 8x15. Los datos son del S19: el .sql va a mu-assets.
#   python3 ops/faseS/gen_shops.py "<Data del servidor S19>" <salida.sql>
import os, re, sys

data, out = sys.argv[1], sys.argv[2]
read = lambda p: open(p, encoding='utf-8-sig').read()
shops = {name: file for name, file in re.findall(r'<Shop ID="\d+" Name="([^"]+)"[^>]*FileScriptsName="([^"]+)"', read(f'{data}/Shops/ShopList.xml'))}
npcs = {}
for index, function in re.findall(r'<Spawn Index="(\d+)"[^>]*NpcFunction="([^"]+)"', read(f'{data}/Monster/MonsterSpawn.xml')):
    if function in shops:
        npcs.setdefault(function, set()).add(int(index))

files = {f.lower(): f for f in os.listdir(f'{data}/Shops/Scripts')}
rows = []
for name, file in shops.items():
    tab = re.search(r'<Tab Id="1">(.*?)</Tab>', read(f'{data}/Shops/Scripts/{files[file.lower()]}'), re.S)
    if not tab:
        continue
    seen = []
    for a in re.findall(r'<Item ([^>]*)/>', tab.group(1)):
        d = dict(re.findall(r'(\w+)="([^"]*)"', a))
        key = tuple(d[k] for k in ('ItemCat', 'ItemIndex', 'ItemLevel', 'ItemDur', 'ItemSkill', 'ItemLuck', 'ItemOption', 'ItemExel'))
        if key not in seen:
            seen.append(key)
    for npc in sorted(npcs.get(name, ())):
        for seq, (cat, idx, lvl, dur, skill, luck, opt, exc) in enumerate(seen):
            rows.append(f"({npc}, {seq}, {int(cat)}, {int(idx)}, {int(lvl)}, {int(dur)}, {int(skill)}, {int(luck)}, {int(opt)}, '{exc}')")

open(out, 'w').write(f"""-- Fase S4: tiendas de NPC del S19 (hecho por mu-web ops/faseS/gen_shops.py). Reversa: drop table.
begin;
create schema if not exists mu_plugins;
drop table if exists mu_plugins.s19_shop;
create table mu_plugins.s19_shop (npc int, seq int, item_group int, item_number int, level int, durability int,
  skill int, luck int, option int, exc text);
insert into mu_plugins.s19_shop values
{',\n'.join(rows)};
commit;
""")
print('ok', len(rows), 'filas;', 'sin NPC:', sorted(set(shops) - set(npcs)))
