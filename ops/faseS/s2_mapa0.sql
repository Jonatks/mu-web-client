-- Fase S2, mapa 0: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m0 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 0);
create table mu_plugins.monster_bak_s2_m0 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (0, 1, 2, 3, 4, 6, 7, 14);
create table mu_plugins.monster_bak_s2_m0_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (0, 1, 2, 3, 4, 6, 7, 14);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 0);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 0), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m0 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (226, 122, 110, 122, 110, 4, 1),
  (229, 136, 88, 136, 88, 2, 1),
  (230, 114, 120, 114, 120, 4, 1),
  (240, 146, 110, 146, 110, 4, 1),
  (240, 147, 145, 147, 145, 2, 1),
  (250, 183, 137, 183, 137, 2, 1),
  (251, 116, 141, 116, 141, 4, 1),
  (253, 127, 86, 127, 86, 3, 1),
  (254, 118, 113, 118, 113, 4, 1),
  (255, 123, 135, 123, 135, 2, 1),
  (257, 96, 129, 96, 129, 2, 1),
  (257, 132, 90, 132, 90, 4, 1),
  (257, 132, 165, 132, 165, 4, 1),
  (257, 170, 129, 170, 129, 2, 1),
  (368, 130, 127, 130, 127, 4, 1),
  (375, 132, 161, 132, 161, 4, 1),
  (543, 144, 127, 144, 127, 4, 1),
  (547, 139, 138, 139, 138, 3, 1),
  (584, 114, 132, 114, 132, 4, 1),
  (764, 131, 147, 131, 147, 3, 1),
  (891, 119, 110, 119, 110, 5, 1),
  (231, 130, 133, 130, 133, 4, 1),
  (3, 180, 90, 226, 244, 0, 45),
  (2, 180, 90, 226, 244, 0, 40),
  (2, 135, 20, 240, 88, 0, 20),
  (0, 135, 20, 240, 88, 0, 45),
  (6, 95, 168, 175, 244, 0, 20),
  (14, 95, 168, 175, 244, 0, 15),
  (1, 8, 11, 94, 244, 0, 45),
  (4, 8, 11, 94, 244, 0, 45),
  (7, 8, 11, 60, 80, 0, 15),
  (3, 186, 127, 186, 127, 0, 1),
  (3, 193, 118, 193, 118, 0, 1),
  (3, 193, 130, 193, 130, 0, 1),
  (3, 188, 119, 188, 119, 0, 1),
  (3, 192, 142, 192, 142, 0, 1),
  (3, 196, 137, 196, 137, 0, 1),
  (3, 189, 140, 189, 140, 0, 1)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 0;
update config."MonsterAttribute" ma set "Value" = 6 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 16 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 20 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 6 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 28 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 6 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 0 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 1;
update config."MonsterAttribute" ma set "Value" = 9 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 22 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 27 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 9 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 39 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 9 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 1 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 2;
update config."MonsterAttribute" ma set "Value" = 4 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 60 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 10 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 13 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 3 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 18 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 3 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 2 and a."Designation" = 'Defense Rate (PvM)';
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
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 4;
update config."MonsterAttribute" ma set "Value" = 12 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 190 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 31 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 36 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 12 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 50 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 12 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 4 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 6;
update config."MonsterAttribute" ma set "Value" = 14 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 255 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 41 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 46 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 14 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 62 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 14 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 6 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 3, "AttackRange" = 2, "AttackDelay" = interval '2200 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 7;
update config."MonsterAttribute" ma set "Value" = 17 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 400 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 57 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 62 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 18 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 18 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 7 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 14;
update config."MonsterAttribute" ma set "Value" = 19 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 525 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 68 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 74 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 22 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 93 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 22 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 14 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (0), (1), (2), (3), (4), (6), (7), (14), (226), (229), (230), (231), (240), (250), (251), (253), (254), (255), (257), (368), (375), (543), (547), (584), (764), (891)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   0 Bull Fighter
--   1 Hound
--   2 Budge Dragon
--   3 Spider
--   4 Elite Bull Fighter
--   6 Lich
--   7 Giant
--   14 Skeleton
--   226 Trainer
--   229 Marlon
--   230 Wandering Merchant Alex
--   231 Thompson Kenel
--   240 Safety Guardian
--   250 Wandering Merchant
--   251 Hanzo the Blacksmith
--   253 Potion Girl Amy
--   254 Pasi the Mage
--   255 Lumen the Barmaid
--   257 Shadow Phantom Soldier
--   368 Elpis
--   375 Chaos Card Master
--   543 Gens Duprian Steward
--   547 Market Union Member Julia
--   584 Sir Lesnar
--   764 Cent (Town)
--   891 Wizard Gillard
