-- Fase S2, mapa 8: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m8 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 8) and s."SpawnTrigger" in (0, 6);
create table mu_plugins.monster_bak_s2_m8 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (57, 58, 59, 60, 61, 62, 63);
create table mu_plugins.monster_bak_s2_m8_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (57, 58, 59, 60, 61, 62, 63);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 8) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 8), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m8 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (605, 188, 54, 188, 54, 0, 1),
  (605, 198, 64, 198, 64, 0, 1),
  (605, 206, 72, 206, 72, 0, 1),
  (605, 206, 55, 206, 55, 0, 1),
  (605, 186, 60, 186, 60, 0, 1),
  (606, 164, 58, 164, 58, 0, 1),
  (606, 197, 57, 197, 57, 0, 1),
  (606, 192, 73, 192, 73, 0, 1),
  (606, 203, 65, 203, 65, 0, 1),
  (607, 205, 59, 205, 59, 0, 1),
  (607, 201, 70, 201, 70, 0, 1),
  (607, 199, 56, 199, 56, 0, 1),
  (61, 7, 205, 7, 205, 0, 1),
  (61, 5, 214, 5, 214, 0, 1),
  (58, 8, 219, 8, 219, 0, 1),
  (61, 6, 228, 6, 228, 0, 1),
  (59, 11, 241, 11, 241, 0, 1),
  (58, 18, 238, 18, 238, 0, 1),
  (62, 146, 53, 146, 53, 0, 1),
  (61, 72, 167, 72, 167, 0, 1),
  (61, 83, 176, 83, 176, 0, 1),
  (61, 63, 173, 63, 173, 0, 1),
  (62, 148, 43, 148, 43, 0, 1),
  (62, 155, 40, 155, 40, 0, 1),
  (62, 134, 57, 134, 57, 0, 1),
  (62, 151, 34, 151, 34, 0, 1),
  (62, 149, 28, 149, 28, 0, 1),
  (62, 141, 74, 141, 74, 0, 1),
  (62, 142, 68, 142, 68, 0, 1),
  (61, 11, 234, 11, 234, 0, 1),
  (62, 141, 24, 141, 24, 0, 1),
  (62, 137, 20, 137, 20, 0, 1),
  (62, 132, 15, 132, 15, 0, 1),
  (60, 148, 66, 148, 66, 0, 1),
  (62, 134, 82, 134, 82, 0, 1),
  (62, 135, 89, 135, 89, 0, 1),
  (62, 136, 96, 136, 96, 0, 1),
  (62, 148, 91, 148, 91, 0, 1),
  (62, 157, 89, 157, 89, 0, 1),
  (62, 158, 80, 158, 80, 0, 1),
  (62, 154, 73, 154, 73, 0, 1),
  (62, 162, 101, 162, 101, 0, 1),
  (62, 161, 110, 161, 110, 0, 1),
  (62, 171, 116, 171, 116, 0, 1),
  (62, 180, 112, 180, 112, 0, 1),
  (62, 190, 112, 190, 112, 0, 1),
  (62, 197, 108, 197, 108, 0, 1),
  (62, 205, 105, 205, 105, 0, 1),
  (62, 186, 120, 186, 120, 0, 1),
  (60, 181, 123, 181, 123, 0, 1),
  (62, 173, 129, 173, 129, 0, 1),
  (62, 169, 136, 169, 136, 0, 1),
  (62, 162, 141, 162, 141, 0, 1),
  (62, 159, 148, 159, 148, 0, 1),
  (62, 151, 155, 151, 155, 0, 1),
  (62, 152, 147, 152, 147, 0, 1),
  (62, 152, 133, 152, 133, 0, 1),
  (62, 162, 129, 162, 129, 0, 1),
  (62, 152, 125, 152, 125, 0, 1),
  (62, 152, 116, 152, 116, 0, 1),
  (62, 171, 106, 171, 106, 0, 1),
  (62, 151, 101, 151, 101, 0, 1),
  (62, 142, 100, 142, 100, 0, 1),
  (62, 140, 37, 140, 37, 0, 1),
  (62, 133, 65, 133, 65, 0, 1),
  (60, 134, 72, 134, 72, 0, 1),
  (60, 128, 74, 128, 74, 0, 1),
  (57, 123, 73, 123, 73, 0, 1),
  (60, 115, 86, 115, 86, 0, 1),
  (60, 121, 87, 121, 87, 0, 1),
  (60, 128, 98, 128, 98, 0, 1),
  (60, 121, 99, 121, 99, 0, 1),
  (60, 108, 95, 108, 95, 0, 1),
  (60, 104, 87, 104, 87, 0, 1),
  (60, 107, 80, 107, 80, 0, 1),
  (60, 109, 64, 109, 64, 0, 1),
  (60, 108, 55, 108, 55, 0, 1),
  (60, 118, 42, 118, 42, 0, 1),
  (60, 126, 42, 126, 42, 0, 1),
  (60, 133, 44, 133, 44, 0, 1),
  (60, 125, 26, 125, 26, 0, 1),
  (60, 113, 34, 113, 34, 0, 1),
  (60, 105, 33, 105, 33, 0, 1),
  (60, 108, 43, 108, 43, 0, 1),
  (60, 103, 49, 103, 49, 0, 1),
  (60, 97, 46, 97, 46, 0, 1),
  (60, 88, 41, 88, 41, 0, 1),
  (60, 95, 26, 95, 26, 0, 1),
  (60, 96, 36, 96, 36, 0, 1),
  (60, 96, 56, 96, 56, 0, 1),
  (60, 102, 61, 102, 61, 0, 1),
  (60, 104, 70, 104, 70, 0, 1),
  (60, 96, 78, 96, 78, 0, 1),
  (60, 97, 66, 97, 66, 0, 1),
  (57, 81, 63, 81, 63, 0, 1),
  (57, 70, 57, 70, 57, 0, 1),
  (57, 65, 64, 65, 64, 0, 1),
  (57, 64, 71, 64, 71, 0, 1),
  (57, 56, 75, 56, 75, 0, 1),
  (57, 46, 71, 46, 71, 0, 1),
  (57, 38, 71, 38, 71, 0, 1),
  (57, 35, 62, 35, 62, 0, 1),
  (57, 27, 75, 27, 75, 0, 1),
  (57, 34, 78, 34, 78, 0, 1),
  (57, 25, 83, 25, 83, 0, 1),
  (57, 21, 92, 21, 92, 0, 1),
  (58, 38, 87, 38, 87, 0, 1),
  (57, 38, 98, 38, 98, 0, 1),
  (57, 48, 99, 48, 99, 0, 1),
  (57, 55, 100, 55, 100, 0, 1),
  (57, 62, 91, 62, 91, 0, 1),
  (57, 70, 92, 70, 92, 0, 1),
  (57, 79, 89, 79, 89, 0, 1),
  (57, 85, 91, 85, 91, 0, 1),
  (60, 91, 86, 91, 86, 0, 1),
  (57, 89, 71, 89, 71, 0, 1),
  (57, 90, 50, 90, 50, 0, 1),
  (58, 69, 120, 69, 120, 0, 1),
  (58, 61, 121, 61, 121, 0, 1),
  (58, 54, 120, 54, 120, 0, 1),
  (58, 43, 121, 43, 121, 0, 1),
  (58, 35, 121, 35, 121, 0, 1),
  (58, 24, 120, 24, 120, 0, 1),
  (58, 18, 127, 18, 127, 0, 1),
  (58, 25, 127, 25, 127, 0, 1),
  (58, 32, 132, 32, 132, 0, 1),
  (58, 29, 98, 29, 98, 0, 1),
  (58, 42, 134, 42, 134, 0, 1),
  (58, 35, 141, 35, 141, 0, 1),
  (58, 26, 149, 26, 149, 0, 1),
  (58, 26, 160, 26, 160, 0, 1),
  (58, 33, 157, 33, 157, 0, 1),
  (58, 40, 150, 40, 150, 0, 1),
  (58, 52, 138, 52, 138, 0, 1),
  (58, 61, 134, 61, 134, 0, 1),
  (60, 74, 81, 74, 81, 0, 1),
  (58, 75, 133, 75, 133, 0, 1),
  (58, 81, 126, 81, 126, 0, 1),
  (58, 87, 120, 87, 120, 0, 1),
  (58, 77, 118, 77, 118, 0, 1),
  (58, 96, 123, 96, 123, 0, 1),
  (58, 107, 119, 107, 119, 0, 1),
  (58, 112, 124, 112, 124, 0, 1),
  (58, 122, 140, 122, 140, 0, 1),
  (58, 107, 139, 107, 139, 0, 1),
  (58, 105, 130, 105, 130, 0, 1),
  (58, 107, 149, 107, 149, 0, 1),
  (58, 86, 131, 86, 131, 0, 1),
  (61, 73, 125, 73, 125, 0, 1),
  (58, 76, 145, 76, 145, 0, 1),
  (58, 69, 139, 69, 139, 0, 1),
  (58, 60, 143, 60, 143, 0, 1),
  (58, 52, 157, 52, 157, 0, 1),
  (58, 52, 165, 52, 165, 0, 1),
  (58, 45, 175, 45, 175, 0, 1),
  (58, 33, 168, 33, 168, 0, 1),
  (58, 35, 175, 35, 175, 0, 1),
  (58, 42, 164, 42, 164, 0, 1),
  (58, 64, 164, 64, 164, 0, 1),
  (61, 131, 178, 131, 178, 0, 1),
  (58, 73, 147, 73, 147, 0, 1),
  (58, 76, 151, 76, 151, 0, 1),
  (58, 93, 137, 93, 137, 0, 1),
  (58, 115, 154, 115, 154, 0, 1),
  (58, 124, 144, 124, 144, 0, 1),
  (58, 129, 141, 129, 141, 0, 1),
  (58, 125, 135, 125, 135, 0, 1),
  (58, 124, 161, 124, 161, 0, 1),
  (58, 115, 168, 115, 168, 0, 1),
  (58, 120, 177, 120, 177, 0, 1),
  (61, 127, 171, 127, 171, 0, 1),
  (61, 127, 188, 127, 188, 0, 1),
  (61, 121, 196, 121, 196, 0, 1),
  (61, 123, 208, 123, 208, 0, 1),
  (61, 121, 217, 121, 217, 0, 1),
  (61, 106, 225, 106, 225, 0, 1),
  (61, 109, 217, 109, 217, 0, 1),
  (61, 102, 212, 102, 212, 0, 1),
  (61, 98, 207, 98, 207, 0, 1),
  (61, 88, 208, 88, 208, 0, 1),
  (61, 80, 207, 80, 207, 0, 1),
  (61, 78, 198, 78, 198, 0, 1),
  (61, 88, 189, 88, 189, 0, 1),
  (61, 83, 185, 83, 185, 0, 1),
  (58, 98, 193, 98, 193, 0, 1),
  (61, 73, 179, 73, 179, 0, 1),
  (58, 71, 184, 71, 184, 0, 1),
  (61, 161, 188, 161, 188, 0, 1),
  (61, 114, 209, 114, 209, 0, 1),
  (61, 153, 187, 153, 187, 0, 1),
  (61, 166, 190, 166, 190, 0, 1),
  (61, 159, 195, 159, 195, 0, 1),
  (61, 172, 195, 172, 195, 0, 1),
  (61, 179, 194, 179, 194, 0, 1),
  (61, 183, 201, 183, 201, 0, 1),
  (61, 177, 207, 177, 207, 0, 1),
  (58, 176, 214, 176, 214, 0, 1),
  (61, 173, 221, 173, 221, 0, 1),
  (58, 160, 203, 160, 203, 0, 1),
  (63, 112, 227, 112, 227, 0, 1),
  (63, 142, 202, 142, 202, 0, 1),
  (61, 161, 218, 161, 218, 0, 1),
  (61, 157, 214, 157, 214, 0, 1),
  (61, 153, 209, 153, 209, 0, 1),
  (61, 150, 203, 150, 203, 0, 1),
  (61, 167, 225, 167, 225, 0, 1),
  (61, 93, 150, 93, 150, 0, 1),
  (61, 169, 204, 169, 204, 0, 1),
  (61, 44, 213, 44, 213, 0, 1),
  (61, 39, 210, 39, 210, 0, 1),
  (61, 31, 207, 31, 207, 0, 1),
  (58, 24, 212, 24, 212, 0, 1),
  (58, 27, 229, 27, 229, 0, 1),
  (61, 31, 236, 31, 236, 0, 1),
  (61, 29, 245, 29, 245, 0, 1),
  (58, 36, 225, 36, 225, 0, 1),
  (58, 42, 244, 42, 244, 0, 1),
  (61, 50, 241, 50, 241, 0, 1),
  (61, 50, 230, 50, 230, 0, 1),
  (61, 43, 222, 43, 222, 0, 1),
  (61, 29, 220, 29, 220, 0, 1),
  (61, 15, 218, 15, 218, 0, 1),
  (61, 19, 205, 19, 205, 0, 1),
  (61, 11, 246, 11, 246, 0, 1),
  (61, 6, 240, 6, 240, 0, 1),
  (61, 157, 224, 157, 224, 0, 1),
  (61, 85, 141, 85, 141, 0, 1),
  (58, 22, 244, 22, 244, 0, 1),
  (58, 52, 204, 52, 204, 0, 1),
  (58, 165, 219, 165, 219, 0, 1),
  (57, 114, 78, 114, 78, 0, 1),
  (58, 49, 161, 49, 161, 0, 1),
  (58, 55, 160, 55, 160, 0, 1),
  (58, 118, 184, 118, 184, 0, 1),
  (58, 108, 163, 108, 163, 0, 1),
  (58, 114, 197, 114, 197, 0, 1),
  (58, 90, 197, 90, 197, 0, 1),
  (58, 68, 129, 68, 129, 0, 1),
  (58, 118, 161, 118, 161, 0, 1),
  (58, 101, 151, 101, 151, 0, 1),
  (58, 98, 131, 98, 131, 0, 1)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 57;
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 17000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 280 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 330 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 215 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 446 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 150 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 57 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 2, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 58;
update config."MonsterAttribute" ma set "Value" = 83 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 22000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 335 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 385 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 250 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 175 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 58 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '86400 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 5, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 59;
update config."MonsterAttribute" ma set "Value" = 90 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 34000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 510 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 590 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 400 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 550 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 185 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 59 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 2, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 60;
update config."MonsterAttribute" ma set "Value" = 76 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 13500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 260 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 300 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 200 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 410 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 130 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 60 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 61;
update config."MonsterAttribute" ma set "Value" = 84 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 25000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 375 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 425 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 275 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 530 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 190 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 61 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 62;
update config."MonsterAttribute" ma set "Value" = 72 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 10000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 250 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 280 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 190 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 365 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 120 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 62 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '150 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 5, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 63;
update config."MonsterAttribute" ma set "Value" = 93 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 40000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 590 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 650 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 420 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 575 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 220 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 63 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (57), (58), (59), (60), (61), (62), (63), (605), (606), (607)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   57 Iron Wheel
--   58 Tantalus
--   59 Zaikan
--   60 Bloody Wolf
--   61 Beam Knight
--   62 Mutant
--   63 Death Beam Knight
--   605 Mining Area (Small)
--   606 Mining Area (Medium)
--   607 Mining Area (Large)
