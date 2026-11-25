# Fase S12: un mapa del S19 que OpenMU no trae (Acheron 91 en adelante): el mapa, sus puertas, su /move, las
# definiciones de sus monstruos y NPC nuevos y sus apariciones.
#   python3 ops/faseS/gen_mapa_nuevo.py "<Data del servidor S19>" <mapa> <carpeta de salida> [--con 91,95]
# --con: los mapas nuevos que ya estan en la base; los pasajes entre este mapa y ellos se agregan en los dos sentidos
# (un pasaje a un mapa que aun no esta se salta).
# Escribe s12_mapa<N>.sql y s12_mapa<N>_undo.sql. Cada fila nueva copia entera una que OpenMU ya tiene (Karutan 1, el
# monstruo Orcus 571, el NPC 226) con to_jsonb, asi no depende de las columnas de la version de OpenMU, y cambia lo
# que dice el S19. Ids fijos 0000ba5e-002k-<numero>-... para deshacerlo.
import re, sys

data, mapnr, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
con = {int(x) for x in sys.argv[sys.argv.index('--con') + 1].split(',')} if '--con' in sys.argv else set()
BASE_MAP, BASE_MONSTER, BASE_NPC = 80, 571, 226
read = lambda p: open(f'{data}/{p}', encoding='utf-8-sig').read()
attrs = lambda tag, text: [dict(re.findall(r'(\w+)="([^"]*)"', a)) for a in re.findall(rf'<{tag} ([^>]*)/>', text)]

world = next(w for w in attrs('World', read('World/WorldTemplate.xml')) if int(w['ID']) == mapnr)
terrain = open(f'{data}/World/Terrain/{world["File"]}', 'rb').read()
assert len(terrain) == 3 + 256 * 256, len(terrain)
all_gates = {int(g['ID']): g for g in attrs('Gate', read('World/GateTemplate.xml'))}
gates = {n: g for n, g in all_gates.items() if int(g['World']) == mapnr}
here = con | {mapnr}
# Entradas: las de este mapa que llevan a este mapa o a uno de --con, y las de --con que llevan a este mapa.
enters = {n: g for n, g in all_gates.items() if g['Flag'] == '1' and int(g['TargetID']) in all_gates
          and int(all_gates[int(g['TargetID'])]['World']) in here and int(g['World']) in here
          and mapnr in (int(g['World']), int(all_gates[int(g['TargetID'])]['World']))}
# /move solo si la puerta de aparicion es de este mapa (la 417 de Debenter es la de Acheron: no tiene /move).
warp = next((t for t in attrs('Teleport', read('World/TeleportTemplate.xml')) if int(t['Gate']) == int(world['SpawnGate'])
             and int(all_gates[int(t['Gate'])]['World']) == mapnr), None)
mons = {int(m['ID']): m for m in attrs('Monster', read('Monster/MonsterList.xml'))}
body = re.search(rf'<Map Number="{mapnr}" [^>]*>(.*?)</Map>', read('Monster/MonsterSpawn.xml'), re.S).group(1)
spawns = []
for kind, spot in re.findall(r'<Spot Type="(\d+)"[^>]*>(.*?)</Spot>', body, re.S):
    if kind not in ('0', '1', '2', '3'):
        continue  # 3: los monstruos elementales del mapa (Acheron), cada uno con su elemento; 4: eventos
    for a in re.findall(r'<Spawn ([^/]*)/>', spot):
        d = {k: int(v) for k, v in re.findall(r'(\w+)="(-?\d+)"', a)}
        spawns.append((d['Index'], d['StartX'], d['StartY'], d.get('EndX', d['StartX']), d.get('EndY', d['StartY']),
                       d['Dir'] + 1 if d['Dir'] >= 0 else 0, d.get('Count', 1)))

gid = lambda kind, n, k=0: f"'0000ba5e-{kind:04x}-{n:04x}-0000-{k:012x}'::uuid"
lit = lambda s: "'" + s.replace("'", "''") + "'"
C = 'config.'
MAP = gid(0x20, mapnr)
clone = lambda table, where, overrides: (
    f'insert into {C}"{table}" select (jsonb_populate_record(null::{C}"{table}", to_jsonb(b) || jsonb_build_object('
    + ', '.join(f"'{k}', {v}" for k, v in overrides.items()) + f'))).* from {C}"{table}" b where {where}')

sql = [f'-- Fase S12, mapa {mapnr} ({world["Name"]}). Generado por ops/faseS/gen_mapa_nuevo.py.', 'begin;',
       f'select 1/(1 - count(*))::int as "el mapa ya existe" from {C}"GameMapDefinition" where "Number" = {mapnr};']
sql.append(clone('GameMapDefinition', f'"Number" = {BASE_MAP}', {
    # Al morir se vuelve al mapa de su puerta de aparicion: Debenter no tiene, vuelve a Acheron (puerta 417).
    'Id': MAP, 'Number': mapnr, 'Name': lit(world['Name'].rsplit(' 1', 1)[0]),
    'SafezoneMapId': gid(0x20, int(all_gates[int(world['SpawnGate'])]['World'])),
    'ExpMultiplier': 1, 'BattleZoneId': 'null', 'TerrainData': lit('\\x' + terrain.hex())}) + ';')

# Puertas: la de llegada (Flag 0) es la salida del /move y del respawn; las de entrada (1) llevan a su salida (2).
for n, g in sorted(gates.items()):
    x1, x2 = sorted((int(g['X1']), int(g['X2']))); y1, y2 = sorted((int(g['Y1']), int(g['Y2'])))
    if g['Flag'] in ('0', '2'):
        sql.append(f'insert into {C}"ExitGate" ("Id","MapId","X1","Y1","X2","Y2","Direction","IsSpawnGate") values '
                   f'({gid(0x21, n)}, {MAP}, {x1}, {y1}, {x2}, {y2}, {g["Direction"]}, {str(g["Flag"] == "0").lower()});')
for n, g in sorted(enters.items()):
    x1, x2 = sorted((int(g['X1']), int(g['X2']))); y1, y2 = sorted((int(g['Y1']), int(g['Y2'])))
    sql.append(f'insert into {C}"EnterGate" ("Id","GameMapDefinitionId","Number","X1","Y1","X2","Y2",'
               f'"LevelRequirement","TargetGateId") values ({gid(0x22, n)}, {gid(0x20, int(g["World"]))}, {n}, {x1}, {y1}, '
               f'{x2}, {y2}, {g["MinLevel"]}, {gid(0x21, int(g["TargetID"]))});')
if warp:
    name = world['Name'].rsplit(' 1', 1)[0]
    sql.append(f'insert into {C}"WarpInfo" ("Id","GameConfigurationId","Index","Name","Costs","LevelRequirement","GateId") '
               f'select {gid(0x23, mapnr)}, "Id", {mapnr}, {lit(name)}, {warp["Zen"]}, {warp["MinLevel"]}, '
               f'{gid(0x21, int(world["SpawnGate"]))} from {C}"GameConfiguration";')
    # El indice es el numero del mapa: la fila de la ventana Move (ops/faseS/cliente_mapa.ts) lleva el mismo.
    sql.insert(3, f'select 1/(1 - count(*))::int as "indice de /move ocupado" from {C}"WarpInfo" where "Index" = {mapnr};')

# Monstruos y NPC que la base no tiene: copia de Orcus o del NPC 226 con lo del S19.
new = sorted({s[0] for s in spawns})
for n in new:
    m = mons[n]
    npc = m['Type'] != '2'
    sql.append(f'-- {n} {m["Name"]}')
    over = {'Id': gid(0x24, n), 'Number': n, 'Designation': lit(m['Name'])}
    if npc:
        over.update({'NpcWindow': 0, 'MerchantStoreId': 'null'})
    else:
        over.update({'RespawnDelay': lit(f'{m["RespawnTimeMin"]} seconds'), 'MoveRange': m['MoveRange'],
                     'ViewRange': m['ViewRange'], 'AttackRange': m['AttackRange'],
                     'AttackDelay': lit(f'{m["AttackSpeed"]} milliseconds'), 'MoveDelay': lit(f'{m["MoveSpeed"]} milliseconds')})
    sql.append(clone('MonsterDefinition', f'"Number" = {BASE_NPC if npc else BASE_MONSTER} and not exists '
                     f'(select 1 from {C}"MonsterDefinition" x where x."Number" = {n})', over) + ';')
    sql.append(f'insert into {C}"MonsterAttribute" select (jsonb_populate_record(null::{C}"MonsterAttribute", to_jsonb(a) || '
               f"jsonb_build_object('Id', ('0000ba5e-0025-{n:04x}-0000-' || lpad(to_hex(row_number() over ()), 12, '0'))::uuid, "
               f"'MonsterDefinitionId', {gid(0x24, n)}))).* "
               f'from {C}"MonsterAttribute" a join {C}"MonsterDefinition" d on d."Id" = a."MonsterDefinitionId" '
               f'where d."Number" = {BASE_NPC if npc else BASE_MONSTER} and exists (select 1 from {C}"MonsterDefinition" x where x."Id" = {gid(0x24, n)}) '
               f'and not exists (select 1 from {C}"MonsterAttribute" y where y."MonsterDefinitionId" = {gid(0x24, n)});')
    if not npc:
        for designation, key in [('Level', 'Level'), ('Maximum Health', 'Life'), ('Minimum Physical Base Damage', 'DamageMin'),
                                 ('Maximum Physical Base Damage', 'DamageMax'), ('Base Defense', 'Defense'),
                                 ('Attack Rate (PvM)', 'AttackSuccesRate'), ('Defense Rate (PvM)', 'DefenseSuccesRate')]:
            sql.append(f'update {C}"MonsterAttribute" ma set "Value" = {m[key]} from {C}"AttributeDefinition" a '
                       f'where a."Id" = ma."AttributeDefinitionId" and ma."MonsterDefinitionId" = {gid(0x24, n)} and a."Designation" = {lit(designation)};')

for k, (n, x1, y1, x2, y2, d, q) in enumerate(spawns):
    sql.append(f'insert into {C}"MonsterSpawnArea" ("Id","GameMapId","MonsterDefinitionId","X1","Y1","X2","Y2","Direction",'
               f'"Quantity","SpawnTrigger","WaveNumber") select {gid(0x26, mapnr, k)}, {MAP}, d."Id", {x1}, {y1}, {x2}, {y2}, '
               f'{d}, {q}, 0, 0 from {C}"MonsterDefinition" d where d."Number" = {n};')
sql += [f'select count(*) || \' apariciones\' from {C}"MonsterSpawnArea" where "GameMapId" = {MAP};', 'commit;']
open(f'{out}/s12_mapa{mapnr}.sql', 'w').write('\n'.join(sql) + '\n')

like = lambda kind: f'"Id"::text like \'0000ba5e-{kind:04x}-%\''
mine = lambda kind, n: f'"Id"::text like \'0000ba5e-{kind:04x}-{n:04x}-%\''
undo = [f'-- Deshace s12_mapa{mapnr}.sql', 'begin;',
        f'delete from {C}"MonsterSpawnArea" where {mine(0x26, mapnr)};',
        f'delete from {C}"WarpInfo" where {mine(0x23, mapnr)};',
        f'delete from {C}"EnterGate" where "GameMapDefinitionId" = {MAP} or "TargetGateId" in '
        f'(select "Id" from {C}"ExitGate" where "MapId" = {MAP});',
        f'delete from {C}"ExitGate" where "MapId" = {MAP};',
        # Solo los de monstruos que ya no aparecen en otro mapa (Debenter comparte tipos con Acheron si los hubiera).
        f'delete from {C}"MonsterAttribute" where "MonsterDefinitionId" in ({", ".join(gid(0x24, n) for n in new)}) '
        f'and not exists (select 1 from {C}"MonsterSpawnArea" s where s."MonsterDefinitionId" = "MonsterAttribute"."MonsterDefinitionId");',
        f'delete from {C}"MonsterDefinition" where "Id" in ({", ".join(gid(0x24, n) for n in new)}) '
        f'and not exists (select 1 from {C}"MonsterSpawnArea" s where s."MonsterDefinitionId" = "MonsterDefinition"."Id");',
        f'delete from {C}"GameMapDefinition" where "Id" = {MAP};', 'commit;']
open(f'{out}/s12_mapa{mapnr}_undo.sql', 'w').write('\n'.join(undo) + '\n')
# Lo que el cliente lee de Data (ops/faseS/cliente_mapa.ts): la fila de Move y las puertas del mapa en gate.bmd.
import json
shown = {n: g for n, g in gates.items() if g['Flag'] != '1'} | enters
cliente = {'gates': [{'n': n, 'flag': int(g['Flag']), 'map': int(g['World']), 'x1': min(int(g['X1']), int(g['X2'])),
                      'y1': min(int(g['Y1']), int(g['Y2'])), 'x2': max(int(g['X1']), int(g['X2'])),
                      'y2': max(int(g['Y1']), int(g['Y2'])), 'target': int(g['TargetID']), 'angle': int(g['Direction']),
                      'level': int(g['MinLevel'])} for n, g in sorted(shown.items())]}
if warp:
    cliente['move'] = {'index': mapnr, 'name': world['Name'].rsplit(' 1', 1)[0], 'level': int(warp['MinLevel']),
                       'zen': int(warp['Zen']), 'gate': int(world['SpawnGate'])}
open(f'{out}/s12_mapa{mapnr}_cliente.json', 'w').write(json.dumps(cliente, indent=1) + '\n')
print('ok', world['Name'], len(gates), 'puertas,', len(new), 'tipos,', len(spawns), 'apariciones', '(move)' if warp else '')
