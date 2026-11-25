-- Generado por ops/faseS/gen_eventos.py
begin;
create schema if not exists mu_plugins;
create table if not exists mu_plugins.plugin_bak_s7 as select "Id", "CustomConfiguration" from config."PlugInConfiguration";
-- BloodCastle/BloodCastle.xml: 22 horarios
update config."PlugInConfiguration" set "CustomConfiguration" = jsonb_set(coalesce(nullif("CustomConfiguration", '')::jsonb, '{}'::jsonb), '{Timetable}', '["00:10:00", "00:40:00", "01:10:00", "01:40:00", "02:10:00", "02:40:00", "03:10:00", "03:40:00", "05:10:00", "07:10:00", "09:10:00", "11:10:00", "13:10:00", "15:10:00", "17:10:00", "19:10:00", "21:10:00", "21:40:00", "22:10:00", "22:40:00", "23:10:00", "23:40:00"]'::jsonb)::text where "TypeId" = '95e68c14-ad87-4b3c-af46-45b8f1c3bc2a';
-- DevilSquare/DevilSquare_Classic.xml: 22 horarios
update config."PlugInConfiguration" set "CustomConfiguration" = jsonb_set(coalesce(nullif("CustomConfiguration", '')::jsonb, '{}'::jsonb), '{Timetable}', '["00:20:00", "00:50:00", "01:20:00", "01:50:00", "02:20:00", "02:50:00", "03:20:00", "03:50:00", "05:20:00", "07:20:00", "09:20:00", "11:20:00", "13:20:00", "15:20:00", "17:20:00", "19:20:00", "21:20:00", "21:50:00", "22:20:00", "22:50:00", "23:20:00", "23:50:00"]'::jsonb)::text where "TypeId" = '61c61a58-211e-4d6a-9ea1-d25e0c4a47c5';
-- ChaosCastle/ChaosCastle.xml: 6 horarios
update config."PlugInConfiguration" set "CustomConfiguration" = jsonb_set(coalesce(nullif("CustomConfiguration", '')::jsonb, '{}'::jsonb), '{Timetable}', '["01:00:00", "15:00:00", "17:00:00", "19:00:00", "21:00:00", "23:00:00"]'::jsonb)::text where "TypeId" = '3ad96a70-ed24-4979-80b8-169e461e548f';
commit;
