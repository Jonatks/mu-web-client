-- Fase S2, mapa 10: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m10 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 10) and s."SpawnTrigger" in (0, 6);
create table mu_plugins.monster_bak_s2_m10 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (69, 70, 71, 72, 73, 74, 75, 77);
create table mu_plugins.monster_bak_s2_m10_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (69, 70, 71, 72, 73, 74, 75, 77);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 10) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 10), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m10 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (77, 34, 238, 34, 238, 2, 1),
  (77, 53, 161, 53, 161, 2, 1),
  (70, 66, 68, 66, 68, 0, 1),
  (70, 85, 88, 85, 88, 0, 1),
  (70, 80, 76, 80, 76, 0, 1),
  (73, 45, 72, 45, 72, 0, 1),
  (72, 41, 113, 41, 113, 0, 1),
  (72, 42, 135, 42, 135, 0, 1),
  (74, 29, 104, 29, 104, 0, 1),
  (74, 38, 103, 38, 103, 0, 1),
  (74, 35, 94, 35, 94, 0, 1),
  (74, 32, 87, 32, 87, 0, 1),
  (73, 35, 69, 35, 69, 0, 1),
  (73, 26, 74, 26, 74, 0, 1),
  (73, 36, 79, 36, 79, 0, 1),
  (74, 39, 85, 39, 85, 0, 1),
  (72, 51, 126, 51, 126, 0, 1),
  (71, 88, 70, 88, 70, 0, 1),
  (72, 53, 138, 53, 138, 0, 1),
  (72, 44, 148, 44, 148, 0, 1),
  (72, 33, 119, 33, 119, 0, 1),
  (74, 33, 111, 33, 111, 0, 1),
  (71, 84, 47, 84, 47, 0, 1),
  (71, 79, 33, 79, 33, 0, 1),
  (71, 58, 42, 58, 42, 0, 1),
  (70, 89, 38, 89, 38, 0, 1),
  (71, 70, 43, 70, 43, 0, 1),
  (71, 64, 30, 64, 30, 0, 1),
  (71, 53, 27, 53, 27, 0, 1),
  (70, 91, 59, 91, 59, 0, 1),
  (72, 41, 157, 41, 157, 0, 1),
  (69, 44, 27, 44, 27, 0, 1),
  (69, 12, 27, 12, 27, 0, 1),
  (69, 13, 38, 13, 38, 0, 1),
  (69, 48, 40, 48, 40, 0, 1),
  (72, 42, 122, 42, 122, 0, 1),
  (69, 28, 28, 28, 28, 0, 1),
  (71, 93, 47, 93, 47, 0, 1),
  (72, 53, 150, 53, 150, 0, 1),
  (75, 50, 162, 50, 162, 0, 1),
  (75, 52, 174, 52, 174, 0, 1),
  (75, 55, 181, 55, 181, 0, 1),
  (75, 44, 212, 44, 212, 0, 1),
  (72, 38, 216, 38, 216, 0, 1),
  (75, 47, 189, 47, 189, 0, 1),
  (75, 59, 190, 59, 190, 0, 1),
  (75, 48, 200, 48, 200, 0, 1),
  (75, 57, 200, 57, 200, 0, 1),
  (75, 27, 220, 27, 220, 0, 1),
  (69, 66, 37, 66, 37, 0, 1),
  (69, 80, 41, 80, 41, 0, 1),
  (75, 43, 238, 43, 238, 0, 1),
  (72, 44, 221, 44, 221, 0, 1),
  (69, 40, 34, 40, 34, 0, 1),
  (69, 31, 37, 31, 37, 0, 1),
  (69, 18, 31, 18, 31, 0, 1),
  (71, 57, 34, 57, 34, 0, 1),
  (71, 71, 33, 71, 33, 0, 1),
  (72, 36, 226, 36, 226, 0, 1),
  (75, 48, 228, 48, 228, 0, 1),
  (70, 84, 36, 84, 36, 0, 1),
  (70, 90, 48, 90, 48, 0, 1),
  (70, 95, 56, 95, 56, 0, 1),
  (70, 74, 84, 74, 84, 0, 1),
  (70, 74, 72, 74, 72, 0, 1),
  (70, 57, 71, 57, 71, 0, 1),
  (73, 28, 67, 28, 67, 0, 1),
  (71, 50, 33, 50, 33, 0, 1),
  (71, 59, 27, 59, 27, 0, 1),
  (71, 74, 38, 74, 38, 0, 1),
  (69, 36, 29, 36, 29, 0, 1),
  (69, 37, 41, 37, 41, 0, 1),
  (69, 26, 41, 26, 41, 0, 1),
  (69, 21, 24, 21, 24, 0, 1),
  (75, 32, 231, 32, 231, 0, 1),
  (75, 45, 173, 45, 173, 0, 1),
  (75, 59, 163, 59, 163, 0, 1),
  (75, 52, 168, 52, 168, 0, 1),
  (69, 21, 36, 21, 36, 0, 1),
  (70, 64, 84, 64, 84, 0, 1),
  (70, 69, 77, 69, 77, 0, 1)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 5, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 69;
update config."MonsterAttribute" ma set "Value" = 75 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 11500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 255 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 290 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 195 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 385 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 125 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 69 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 3, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 70;
update config."MonsterAttribute" ma set "Value" = 82 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 19000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 305 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 350 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 230 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 475 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 160 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 70 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 71;
update config."MonsterAttribute" ma set "Value" = 78 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 15000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 270 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 320 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 210 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 430 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 71 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '30 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 2, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 72;
update config."MonsterAttribute" ma set "Value" = 96 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 41000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 560 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 610 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 425 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 690 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 270 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 72 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '20 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 5, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 73;
update config."MonsterAttribute" ma set "Value" = 86 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 29000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 425 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 480 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 305 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 570 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 210 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 73 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 74;
update config."MonsterAttribute" ma set "Value" = 92 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 34500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 489 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 540 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 360 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 620 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 240 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 74 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '30 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 5, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 75;
update config."MonsterAttribute" ma set "Value" = 100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 50000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 650 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 700 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 495 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 800 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 305 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 75 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '150 seconds', "MoveRange" = 1,
  "ViewRange" = 7, "AttackRange" = 6, "AttackDelay" = interval '1500 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 77;
update config."MonsterAttribute" ma set "Value" = 108 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 75000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 695 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 740 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 510 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 900 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 350 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 77 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (69), (70), (71), (72), (73), (74), (75), (77)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   69 Alquamos
--   70 Queen Rainier
--   71 Mega Crust
--   72 Phantom Knight
--   73 Drakan
--   74 Alpha Crust
--   75 Great Drakan
--   77 Phoenix of Darkness
