# Fase S5: puertas y /move como en el S19 (World/GateTemplate.xml, World/TeleportTemplate.xml).
#   python3 ops/faseS/gen_gates.py "<Data del servidor S19>" <carpeta de salida>
# Puertas de entrada (Flag 1): el mismo numero en el mismo mapa toma el area y el nivel del S19, y su salida el area
# y la direccion del destino del S19 (solo si cae en el mismo mapa). /move: cada destino de OpenMU con el mismo nombre
# toma el costo y el nivel del S19, y su salida el area de la puerta del S19. Lo nuevo (mapas que no estan) se salta.
# Escribe s5_puertas.sql y s5_puertas_undo.sql, con respaldo en mu_plugins.
import re, sys

data, out = sys.argv[1:3]
attrs = lambda tag, text: [dict(re.findall(r'(\w+)="([^"]*)"', a)) for a in re.findall(rf'<{tag} ([^>]*)/>', text)]
gates = {int(g['ID']): g for g in attrs('Gate', open(f'{data}/World/GateTemplate.xml', encoding='utf-8-sig').read())}
warps = attrs('Teleport', open(f'{data}/World/TeleportTemplate.xml', encoding='utf-8-sig').read())

C = 'config.'
gm = lambda n: f'(select "Id" from {C}"GameMapDefinition" where "Number" = {n})'
def sane(g):  # un area de puerta del S19 mal escrita (Arena: 57-62 x 28-113) no se copia
    return abs(int(g['X2']) - int(g['X1'])) <= 30 and abs(int(g['Y2']) - int(g['Y1'])) <= 30

def area(g):
    x1, x2 = sorted((int(g['X1']), int(g['X2']))); y1, y2 = sorted((int(g['Y1']), int(g['Y2'])))
    return f'"X1" = {x1}, "Y1" = {y1}, "X2" = {x2}, "Y2" = {y2}'
sql = ['-- Generado por ops/faseS/gen_gates.py', 'begin;', 'create schema if not exists mu_plugins;']
for t in ('EnterGate', 'ExitGate', 'WarpInfo'):
    sql.append(f'create table if not exists mu_plugins."{t.lower()}_bak_s5" as select * from {C}"{t}";')

for n, g in sorted(gates.items()):
    if g['Flag'] != '1' or int(g['TargetID']) not in gates or not sane(g) or not sane(gates[int(g['TargetID'])]):
        continue
    t = gates[int(g['TargetID'])]
    sql.append(f'update {C}"EnterGate" set {area(g)}, "LevelRequirement" = {g["MinLevel"]} '
               f'where "Number" = {n} and "GameMapDefinitionId" = {gm(g["World"])};')
    direction = f', "Direction" = {t["Direction"]}' if t['Direction'] != '0' else ''
    sql.append(f'update {C}"ExitGate" x set {area(t)}{direction} from {C}"EnterGate" e '
               f'where e."Number" = {n} and e."GameMapDefinitionId" = {gm(g["World"])} and x."Id" = e."TargetGateId" '
               f'and x."MapId" = {gm(t["World"])};')

for w in warps:
    g = gates.get(int(w['Gate']))
    name = w['Name'].replace("'", "''").replace(' ', '')
    match = lambda t='': f"replace(split_part({t}\"Name\", '||', 1), ' ', '') ilike '{name}'"
    sql.append(f'update {C}"WarpInfo" set "Costs" = {w["Zen"]}, "LevelRequirement" = {w["MinLevel"]} where {match()};')
    if g and sane(g):
        sql.append(f'update {C}"ExitGate" x set {area(g)} from {C}"WarpInfo" w where {match('w.')} '
                   f'and x."Id" = w."GateId" and x."MapId" = {gm(g["World"])};')
sql.append('commit;')
open(f'{out}/s5_puertas.sql', 'w').write('\n'.join(sql) + '\n')

undo = ['-- Deshace s5_puertas.sql desde sus respaldos', 'begin;']
cols = {'EnterGate': '"X1","Y1","X2","Y2","LevelRequirement"', 'ExitGate': '"X1","Y1","X2","Y2","Direction"',
        'WarpInfo': '"Costs","LevelRequirement"'}
for t, c in cols.items():
    sets = ', '.join(f'{k} = b.{k}' for k in c.split(','))
    undo.append(f'update {C}"{t}" o set {sets} from mu_plugins."{t.lower()}_bak_s5" b where o."Id" = b."Id";')
undo.append('commit;')
open(f'{out}/s5_puertas_undo.sql', 'w').write('\n'.join(undo) + '\n')
print(len(sql), 'sentencias')
