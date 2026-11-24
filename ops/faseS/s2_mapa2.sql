-- Fase S2, mapa 2: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m2 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 2) and s."SpawnTrigger" in (0, 6);
create table mu_plugins.monster_bak_s2_m2 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (19, 20, 21, 22, 23, 24, 25);
create table mu_plugins.monster_bak_s2_m2_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (19, 20, 21, 22, 23, 24, 25);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 2) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 2), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m2 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (229, 184, 29, 184, 29, 4, 1),
  (235, 183, 32, 183, 32, 4, 1),
  (240, 218, 63, 218, 63, 3, 1),
  (241, 215, 45, 215, 45, 2, 1),
  (244, 226, 25, 226, 25, 4, 1),
  (245, 225, 41, 225, 41, 4, 1),
  (246, 186, 47, 186, 47, 4, 1),
  (257, 219, 73, 219, 73, 4, 1),
  (257, 172, 44, 172, 44, 2, 1),
  (379, 32, 31, 32, 31, 4, 1),
  (566, 204, 61, 204, 61, 2, 1),
  (584, 240, 53, 240, 53, 8, 1),
  (233, 219, 9, 219, 9, 4, 1),
  (233, 209, 30, 209, 30, 2, 1),
  (941, 193, 12, 193, 12, 5, 1),
  (24, 170, 80, 245, 134, 0, 30),
  (23, 171, 101, 245, 200, 0, 10),
  (22, 50, 6, 166, 244, 0, 40),
  (23, 50, 6, 166, 244, 0, 30),
  (19, 51, 6, 113, 244, 0, 40),
  (21, 50, 6, 166, 244, 0, 40),
  (20, 50, 6, 166, 244, 0, 20),
  (20, 5, 50, 50, 155, 0, 20),
  (20, 6, 184, 80, 244, 0, 10),
  (25, 6, 184, 80, 244, 0, 1),
  (20, 196, 235, 196, 235, 0, 1),
  (20, 194, 241, 194, 241, 0, 1),
  (20, 201, 237, 201, 237, 0, 1),
  (20, 209, 224, 209, 224, 0, 1),
  (20, 186, 224, 186, 224, 0, 1),
  (20, 200, 171, 200, 171, 0, 1),
  (20, 207, 158, 207, 158, 0, 1),
  (20, 221, 177, 221, 177, 0, 1),
  (20, 213, 193, 213, 193, 0, 1),
  (20, 196, 218, 196, 218, 0, 1),
  (20, 230, 200, 230, 200, 0, 1),
  (20, 221, 160, 221, 160, 0, 1),
  (20, 205, 149, 205, 149, 0, 1),
  (20, 184, 166, 184, 166, 0, 1),
  (20, 212, 170, 212, 170, 0, 1),
  (20, 203, 201, 203, 201, 0, 1),
  (24, 170, 6, 170, 6, 0, 1),
  (24, 161, 58, 161, 58, 0, 1),
  (24, 180, 78, 180, 78, 0, 1),
  (20, 190, 146, 190, 146, 0, 1),
  (20, 189, 160, 189, 160, 0, 1),
  (20, 207, 183, 207, 183, 0, 1),
  (20, 218, 201, 218, 201, 0, 1),
  (20, 240, 207, 240, 207, 0, 1),
  (20, 238, 184, 238, 184, 0, 1),
  (20, 227, 167, 227, 167, 0, 1),
  (20, 202, 209, 202, 209, 0, 1),
  (20, 113, 105, 113, 105, 0, 1),
  (20, 96, 103, 96, 103, 0, 1),
  (20, 102, 117, 102, 117, 0, 1),
  (20, 241, 198, 241, 198, 0, 1),
  (20, 228, 184, 228, 184, 0, 1),
  (20, 200, 243, 200, 243, 0, 1),
  (20, 214, 152, 214, 152, 0, 1),
  (20, 197, 183, 197, 183, 0, 1),
  (24, 162, 11, 162, 11, 0, 1),
  (24, 244, 80, 244, 80, 0, 1),
  (24, 238, 88, 238, 88, 0, 1),
  (24, 229, 83, 229, 83, 0, 1)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 6, "AttackRange" = 4, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 19;
update config."MonsterAttribute" ma set "Value" = 30 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 900 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 105 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 110 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 37 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 150 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 37 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 19 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 6, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 20;
update config."MonsterAttribute" ma set "Value" = 36 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1200 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 120 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 125 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 50 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 180 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 43 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 20 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 7, "AttackRange" = 1, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 21;
update config."MonsterAttribute" ma set "Value" = 26 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 800 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 95 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 33 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 130 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 33 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 21 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 22;
update config."MonsterAttribute" ma set "Value" = 22 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 650 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 85 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 27 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 110 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 27 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 22 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 23;
update config."MonsterAttribute" ma set "Value" = 24 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 700 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 85 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 90 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 29 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 120 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 29 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 23 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 24;
update config."MonsterAttribute" ma set "Value" = 20 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 600 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 75 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 25 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 25 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 24 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '86400 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 25;
update config."MonsterAttribute" ma set "Value" = 52 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 4000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 155 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 165 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 90 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 260 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 76 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 25 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (19), (20), (21), (22), (23), (24), (25), (229), (233), (235), (240), (241), (244), (245), (246), (257), (379), (566), (584), (941)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   19 Yeti
--   20 Elite Yeti
--   21 Assassin
--   22 Ice Monster
--   23 Hommerd
--   24 Worm
--   25 Ice Queen
--   229 Marlon
--   233 Messenger of Archangel
--   235 Sebina the Priest
--   240 Safety Guardian
--   241 Royal Guard Captain Lorence
--   244 Caren the Barmaid
--   245 Wizard Izabel
--   246 Weapons Merchant Zienna
--   257 Shadow Phantom Soldier
--   379 Natasha Firecracker Merchant
--   566 Mercenary Guild Manager Tercia
--   584 Sir Lesnar
--   941 Eunice (Quest)
