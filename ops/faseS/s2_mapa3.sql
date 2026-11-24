-- Fase S2, mapa 3: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m3 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 3) and s."SpawnTrigger" in (0, 6);
create table mu_plugins.monster_bak_s2_m3 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (3, 26, 27, 28, 29, 30, 31, 32, 33);
create table mu_plugins.monster_bak_s2_m3_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (3, 26, 27, 28, 29, 30, 31, 32, 33);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 3) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 3), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m3 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (229, 169, 89, 169, 89, 3, 1),
  (237, 171, 105, 171, 105, 4, 1),
  (238, 180, 103, 180, 103, 2, 1),
  (240, 172, 96, 172, 96, 4, 1),
  (242, 173, 125, 173, 125, 2, 1),
  (243, 195, 124, 195, 124, 3, 1),
  (257, 167, 118, 167, 118, 2, 1),
  (257, 166, 85, 166, 85, 3, 1),
  (257, 201, 129, 201, 129, 3, 1),
  (544, 167, 100, 167, 100, 3, 1),
  (568, 186, 109, 186, 109, 3, 1),
  (580, 196, 113, 196, 113, 3, 1),
  (584, 183, 126, 183, 126, 3, 1),
  (3, 139, 63, 247, 164, 0, 60),
  (26, 109, 46, 154, 181, 0, 10),
  (26, 136, 156, 247, 204, 0, 10),
  (26, 135, 42, 247, 73, 0, 10),
  (27, 109, 46, 154, 181, 0, 20),
  (27, 135, 42, 247, 73, 0, 20),
  (27, 136, 156, 247, 204, 0, 20),
  (33, 106, 3, 247, 40, 0, 20),
  (33, 59, 6, 128, 106, 0, 20),
  (28, 106, 3, 247, 40, 0, 20),
  (28, 59, 6, 128, 106, 0, 20),
  (29, 106, 3, 247, 40, 0, 20),
  (29, 59, 6, 128, 106, 0, 20),
  (30, 7, 4, 63, 176, 0, 10),
  (30, 41, 107, 107, 181, 0, 10),
  (30, 105, 184, 247, 246, 0, 10),
  (31, 7, 4, 63, 176, 0, 20),
  (31, 41, 107, 107, 181, 0, 20),
  (31, 105, 184, 247, 246, 0, 20),
  (32, 4, 168, 115, 248, 0, 40),
  (3, 154, 121, 154, 121, 0, 8),
  (30, 123, 115, 123, 115, 0, 8),
  (26, 153, 71, 153, 71, 0, 8),
  (28, 205, 149, 205, 149, 0, 8)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1800 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 3;
update config."MonsterAttribute" ma set "Value" = 2 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 30 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 4 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 7 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 1 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 8 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 1 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 3 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1800 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 26;
update config."MonsterAttribute" ma set "Value" = 3 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 45 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 7 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 10 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 2 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 13 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 2 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 26 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1800 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 27;
update config."MonsterAttribute" ma set "Value" = 5 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 13 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 17 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 4 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 23 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 4 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 27 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 28;
update config."MonsterAttribute" ma set "Value" = 10 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 165 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 26 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 31 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 10 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 44 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 10 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 28 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 4, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 29;
update config."MonsterAttribute" ma set "Value" = 13 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 220 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 36 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 41 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 13 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 56 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 13 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 29 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 30;
update config."MonsterAttribute" ma set "Value" = 15 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 295 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 46 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 51 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 15 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 68 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 15 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 30 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 31;
update config."MonsterAttribute" ma set "Value" = 16 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 340 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 51 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 57 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 16 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 74 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 16 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 31 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 3, "AttackRange" = 2, "AttackDelay" = interval '2200 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 32;
update config."MonsterAttribute" ma set "Value" = 18 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 465 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 62 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 68 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 20 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 86 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 20 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 32 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 33;
update config."MonsterAttribute" ma set "Value" = 8 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 120 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 19 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 23 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 8 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 33 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 8 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 33 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (3), (26), (27), (28), (29), (30), (31), (32), (33), (229), (237), (238), (240), (242), (243), (257), (544), (568), (580), (584)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   3 Spider
--   26 Goblin
--   27 Chain Scorpion
--   28 Beetle Monster
--   29 Hunter
--   30 Forest Monster
--   31 Agon
--   32 Stone Golem
--   33 Elite Goblin
--   229 Marlon
--   237 Charon
--   238 Chaos Goblin
--   240 Safety Guardian
--   242 Elf Lala
--   243 Gallus the Elder
--   257 Shadow Phantom Soldier
--   544 Gens Vanert Steward
--   568 Wandering Merchant Zyro
--   580 Captain Slough
--   584 Sir Lesnar
