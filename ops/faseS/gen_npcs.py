# NPC del S19 que OpenMU no trae: su definicion (copiada de un NPC de OpenMU del mismo tipo) y sus apariciones en
# Monster/MonsterSpawn.xml. Gillard (891) lleva tienda vacia: la llena el plugin S19Shops. Los demas solo hablan
# (ventana 0: sus misiones del S19 no existen en OpenMU).
#   python3 ops/faseS/gen_npcs.py "<Data del servidor S19>" <carpeta de salida>
# Escribe s9_npcs.sql y s9_npcs_undo.sql. Ids fijos 0000ba5e-0018-<numero>-... para poder deshacerlos.
import re, sys

data, out = sys.argv[1:3]
# numero: (nombre, NPC de OpenMU que se copia, con tienda)
NPCS = {580: ('Captain Slough', 226, False), 584: ('Sir Lesnar', 226, False), 764: ('Cent', 226, False),
        891: ('Wizard Gillard', 253, True), 941: ('Eunice', 226, False)}

spawns = []
text = open(f'{data}/Monster/MonsterSpawn.xml', encoding='utf-8-sig').read()
for number, body in re.findall(r'<Map Number="(\d+)"[^>]*>(.*?)</Map>', text, re.S):
    for a in re.findall(r'<Spawn ([^>]*)/>', body):
        d = dict(re.findall(r'(\w+)="([^"]*)"', a))
        if int(d['Index']) in NPCS:
            spawns.append((int(d['Index']), int(number), int(d['StartX']), int(d['StartY']), int(d.get('Dir', '-1'))))

gid = lambda kind, n, k=0: f"'0000ba5e-{kind:04x}-{n:04x}-0000-{k:012x}'"
cols = '"AttackSkillId","GameConfigurationId","MoveRange","AttackRange","ViewRange","MoveDelay","AttackDelay","RespawnDelay","Attribute","NumberOfMaximumItemDrops","NpcWindow","ObjectKind","IntelligenceTypeName","IntroducedIn","IsActive"'
sql = ['-- Generado por ops/faseS/gen_npcs.py', 'begin;']
for n, (name, base, store) in NPCS.items():
    if store:
        sql.append(f'insert into data."ItemStorage" ("Id","Money") values ({gid(0x19, n)}, 0) on conflict do nothing;')
    sql.append(f'insert into config."MonsterDefinition" ("Id","MerchantStoreId","Number","Designation",{cols}) '
               f'select {gid(0x18, n)}, {gid(0x19, n) if store else "null"}, {n}, \'{name}\', '
               f'{cols if store else cols.replace(chr(34) + "NpcWindow" + chr(34), "0")} '
               f'from config."MonsterDefinition" where "Number" = {base} '
               f'and not exists (select 1 from config."MonsterDefinition" where "Number" = {n});')
for k, (n, map_, x, y, d) in enumerate(spawns):
    sql.append(f'insert into config."MonsterSpawnArea" ("Id","MonsterDefinitionId","GameMapId","X1","Y1","X2","Y2",'
               f'"Direction","Quantity","SpawnTrigger","WaveNumber") select {gid(0x1a, n, k)}, {gid(0x18, n)}, "Id", '
               f'{x}, {y}, {x}, {y}, {max(d, 0) + 1 if d >= 0 else 0}, 1, 0, 0 from config."GameMapDefinition" '
               f'where "Number" = {map_} and exists (select 1 from config."MonsterDefinition" where "Id" = {gid(0x18, n)}) '
               f'on conflict do nothing;')
sql.append('commit;')
open(f'{out}/s9_npcs.sql', 'w').write('\n'.join(sql) + '\n')
open(f'{out}/s9_npcs_undo.sql', 'w').write('\n'.join([
    '-- Deshace s9_npcs.sql', 'begin;',
    'delete from config."MonsterSpawnArea" where "Id"::text like \'0000ba5e-001a-%\';',
    'delete from config."MonsterDefinition" where "Id"::text like \'0000ba5e-0018-%\';',
    'delete from data."ItemStorage" where "Id"::text like \'0000ba5e-0019-%\';',
    'commit;']) + '\n')
print(len(spawns), 'apariciones', sorted({(n, m) for n, m, *_ in spawns}))
