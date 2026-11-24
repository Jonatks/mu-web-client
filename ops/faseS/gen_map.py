# Fase S2: los monstruos y NPC de un mapa como en el S19 (Monster/MonsterSpawn.xml y MonsterList.xml).
#   python3 ops/faseS/gen_map.py "<Data del servidor S19>" <numero de mapa> <carpeta de salida>
# Escribe s2_mapa<N>.sql y s2_mapa<N>_undo.sql. Lo que no tiene definicion en la base (NPC nuevos del S19) se salta y
# queda listado al final del .sql.
import re, sys

data, mapnr, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
spawn = open(f'{data}/Monster/MonsterSpawn.xml', encoding='utf-8-sig').read()
body = re.search(rf'<Map Number="{mapnr}" [^>]*>(.*?)</Map>', spawn, re.S).group(1)
mons = {}
for a in re.findall(r'<Monster ([^>]*)/>', open(f'{data}/Monster/MonsterList.xml', encoding='utf-8-sig').read()):
    d = dict(re.findall(r'(\w+)="([^"]*)"', a))
    mons[int(d['ID'])] = d

rows = []  # (numero, x1, y1, x2, y2, direccion OpenMU, cantidad)
for kind, spot in re.findall(r'<Spot Type="(\d+)"[^>]*>(.*?)</Spot>', body, re.S):
    if kind not in ('0', '1', '2'):
        continue  # 3 y 4: monstruos elementales de eventos, aparte
    for a in re.findall(r'<Spawn ([^/]*)/>', spot):
        d = {k: int(v) for k, v in re.findall(r'(\w+)="(-?\d+)"', a)}
        x2, y2 = d.get('EndX', d['StartX']), d.get('EndY', d['StartY'])
        rows.append((d['Index'], d['StartX'], d['StartY'], x2, y2, d['Dir'] + 1 if d['Dir'] >= 0 else 0, d.get('Count', 1)))

nums = sorted({r[0] for r in rows})
monsters = [n for n in nums if mons[n]['Type'] == '2']
bak = f'mu_plugins.spawn_bak_s2_m{mapnr}'
mbak = f'mu_plugins.monster_bak_s2_m{mapnr}'
area = 'config."MonsterSpawnArea"'
gm = f'(select "Id" from config."GameMapDefinition" where "Number" = {mapnr})'
values = ',\n  '.join(f'({n}, {x1}, {y1}, {x2}, {y2}, {d}, {q})' for n, x1, y1, x2, y2, d, q in rows)
# Lo que el S19 dice de cada monstruo: tiempos y rangos en la definicion, estadisticas en sus atributos.
upd = []
for n in monsters:
    m = mons[n]
    upd.append(f"""update config."MonsterDefinition" set "RespawnDelay" = interval '{m['RespawnTimeMin']} seconds', "MoveRange" = {m['MoveRange']},
  "ViewRange" = {m['ViewRange']}, "AttackRange" = {m['AttackRange']}, "AttackDelay" = interval '{m['AttackSpeed']} milliseconds',
  "MoveDelay" = interval '{m['MoveSpeed']} milliseconds' where "Number" = {n};""")
    for designation, key in [('Level', 'Level'), ('Maximum Health', 'Life'), ('Minimum Physical Base Damage', 'DamageMin'),
                             ('Maximum Physical Base Damage', 'DamageMax'), ('Base Defense', 'Defense'),
                             ('Attack Rate (PvM)', 'AttackSuccesRate'), ('Defense Rate (PvM)', 'DefenseSuccesRate')]:
        upd.append(f"""update config."MonsterAttribute" ma set "Value" = {m[key]} from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = {n} and a."Designation" = '{designation}';""")
mlist = ', '.join(map(str, monsters))
names = '\n'.join(f'--   {n} {mons[n]["Name"]}' for n in nums)

open(f'{out}/s2_mapa{mapnr}.sql', 'w').write(f"""-- Fase S2, mapa {mapnr}: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table {bak} as select s.* from {area} s where s."GameMapId" = {gm};
create table {mbak} as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in ({mlist});
create table {mbak}_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in ({mlist});
delete from {area} where "GameMapId" = {gm};
insert into {area} ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), {gm}, d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from {bak} b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  {values}
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
{chr(10).join(upd)}
select 'sin definicion en la base', v.n from (values {', '.join(f'({n})' for n in nums)}) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
{names}
""")
open(f'{out}/s2_mapa{mapnr}_undo.sql', 'w').write(f"""begin;
delete from {area} where "GameMapId" = {gm};
insert into {area} select * from {bak};
update config."MonsterDefinition" d set "RespawnDelay" = b."RespawnDelay", "MoveRange" = b."MoveRange", "ViewRange" = b."ViewRange",
  "AttackRange" = b."AttackRange", "AttackDelay" = b."AttackDelay", "MoveDelay" = b."MoveDelay" from {mbak} b where b."Id" = d."Id";
update config."MonsterAttribute" ma set "Value" = b."Value" from {mbak}_attr b where b."Id" = ma."Id";
drop table {bak}; drop table {mbak}; drop table {mbak}_attr;
commit;
""")
print('ok', len(rows), 'filas,', len(monsters), 'monstruos')
