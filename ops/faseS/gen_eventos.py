# Fase S7: los horarios de Blood Castle, Devil Square y Chaos Castle del S19 (Data/Event) en los plugins de inicio de
# OpenMU (PlugInConfiguration.CustomConfiguration, campo Timetable). Lo demas de cada configuracion queda como esta.
#   python3 ops/faseS/gen_eventos.py "<Data/Event del servidor S19>" <salida>
import os, re, sys

src, out = sys.argv[1:3]
EVENTS = {'BloodCastle/BloodCastle.xml': '95e68c14-ad87-4b3c-af46-45b8f1c3bc2a',
          'DevilSquare/DevilSquare_Classic.xml': '61c61a58-211e-4d6a-9ea1-d25e0c4a47c5',
          'ChaosCastle/ChaosCastle.xml': '3ad96a70-ed24-4979-80b8-169e461e548f'}
sql = ['-- Generado por ops/faseS/gen_eventos.py', 'begin;', 'create schema if not exists mu_plugins;',
       'create table if not exists mu_plugins.plugin_bak_s7 as select "Id", "CustomConfiguration" from config."PlugInConfiguration";']
for f, guid in EVENTS.items():
    t = re.sub(r'<!--.*?-->', '', open(os.path.join(src, f), encoding='utf-8-sig').read(), flags=re.S)
    times = sorted({(int(h), int(m)) for h, m in re.findall(r'<Start [^>]*Hour="(\d+)" Minute="(\d+)"', t)})
    table = ', '.join(f'"{h:02}:{m:02}:00"' for h, m in times)
    sql.append(f'-- {f}: {len(times)} horarios')
    sql.append(f"""update config."PlugInConfiguration" set "CustomConfiguration" = jsonb_set(coalesce(nullif("CustomConfiguration", '')::jsonb, '{{}}'::jsonb), '{{Timetable}}', '[{table}]'::jsonb)::text where "TypeId" = '{guid}';""")
sql.append('commit;')
open(os.path.join(out, 's7_eventos.sql'), 'w').write('\n'.join(sql) + '\n')
open(os.path.join(out, 's7_eventos_undo.sql'), 'w').write(
    '-- Deshace s7_eventos.sql\nupdate config."PlugInConfiguration" o set "CustomConfiguration" = b."CustomConfiguration" '
    'from mu_plugins.plugin_bak_s7 b where o."Id" = b."Id";\n')
print('listo')
