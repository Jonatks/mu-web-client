# Fase S3: los drops del S19 (Item/Drop: AllMonsterBag, EachMonsterMapDrop, SetItemMonsterBag, EventItemMonsterBag,
# ItemDropRateControl.ini) como tablas de mu_plugins que lee el plugin S19Drops. Los datos son del S19: el .sql va al
# repositorio privado mu-assets, nunca a este.
#   python3 ops/faseS/gen_drops.py "<Data del servidor S19>" <salida.sql>
import os, re, sys

data, out = sys.argv[1], sys.argv[2]
drop = f'{data}/Item/Drop'
def rows(text):
    return [dict(re.findall(r'(\w+)="([^"]*)"', a)) for a in re.findall(r'<DropItem ([^>]*)/>', text)]
def read(path):
    return open(path, encoding='utf-8-sig').read()
def q(v):
    return "'" + v.replace("'", "''") + "'"

lines = []
def add(system, mapnr, r):
    g = lambda k, d='-1': r.get(k, d)
    lines.append(f"({q(system)}, {mapnr}, {g('MonsterID')}, {g('MonsterMinLevel')}, {g('MonsterMaxLevel')}, {g('Cat')}, {g('Index')}, "
                 f"{g('MinLevel', '0')}, {g('MaxLevel', '0')}, {g('Durability', '0')}, {g('Skill', '0')}, {g('Luck', '0')}, {g('Option', '0')}, "
                 f"{q(g('Exc'))}, {q(g('SocketCount', '0;0'))}, {g('SetOption', '0')}, {g('EventType')}, {g('Rate')})")

for r in rows(read(f'{drop}/AllMonsterBag.xml')):
    add('all', -1, r)
for mapnr, name in re.findall(r'<Map Number="(\d+)" FileName="([^"]+)"', read(f'{drop}/EachMonsterMapList.xml')):
    path = f'{drop}/EachMonsterMapDrop/{name}'
    if os.path.exists(path):
        for r in rows(read(path)):
            add('each', mapnr, r)
for mapnr, body in re.findall(r'<Map Number="(\d+)"[^>]*>(.*?)</Map>', read(f'{drop}/SetItemMonsterBag.xml'), re.S):
    for r in rows(body):
        add('set', mapnr, r)
for r in rows(read(f'{drop}/EventItemMonsterBag.xml')):
    add('event', -1, r)

control = dict(re.findall(r'^\s*(\w+)\s*=\s*([\d.]+)', read(f'{drop}/ItemDropRateControl.ini'), re.M))
ctrl = ',\n'.join(f'({q(k)}, {float(v)})' for k, v in control.items())
body = ',\n'.join(lines)
open(out, 'w').write(f"""-- Fase S3: drops del S19 (hecho por mu-web ops/faseS/gen_drops.py). Reversa: drop table de las dos tablas.
begin;
create schema if not exists mu_plugins;
drop table if exists mu_plugins.s19_drop;
drop table if exists mu_plugins.s19_drop_control;
create table mu_plugins.s19_drop (system text, map int, monster int, monster_min_level int, monster_max_level int,
  item_group int, item_number int, min_level int, max_level int, durability int, skill int, luck int, option int,
  exc text, sockets text, set_option int, event_type int, rate int);
create table mu_plugins.s19_drop_control (key text primary key, value double precision);
insert into mu_plugins.s19_drop values
{body};
insert into mu_plugins.s19_drop_control values
{ctrl};
commit;
""")
print('ok', len(lines), 'filas')
