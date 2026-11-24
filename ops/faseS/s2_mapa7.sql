-- Fase S2, mapa 7: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m7 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 7) and s."SpawnTrigger" in (0, 6);
create table mu_plugins.monster_bak_s2_m7 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (45, 46, 47, 48, 49, 51, 52);
create table mu_plugins.monster_bak_s2_m7_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (45, 46, 47, 48, 49, 51, 52);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 7) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 7), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m7 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (46, 49, 10, 49, 10, 0, 5),
  (45, 54, 47, 54, 47, 0, 5),
  (45, 24, 57, 24, 57, 0, 5),
  (47, 23, 120, 23, 120, 0, 5),
  (51, 226, 53, 226, 53, 0, 3),
  (48, 226, 53, 226, 53, 0, 3),
  (48, 68, 170, 68, 170, 0, 3),
  (48, 236, 177, 236, 177, 0, 1),
  (51, 212, 96, 212, 96, 0, 1),
  (45, 21, 41, 21, 41, 0, 1),
  (45, 23, 33, 23, 33, 0, 1),
  (45, 31, 31, 31, 31, 0, 1),
  (45, 39, 23, 39, 23, 0, 1),
  (45, 41, 11, 41, 11, 0, 1),
  (45, 21, 48, 21, 48, 0, 1),
  (45, 47, 41, 47, 41, 0, 1),
  (45, 39, 63, 39, 63, 0, 1),
  (45, 72, 42, 72, 42, 0, 1),
  (45, 23, 56, 23, 56, 0, 1),
  (45, 23, 64, 23, 64, 0, 1),
  (45, 35, 70, 35, 70, 0, 1),
  (45, 29, 75, 29, 75, 0, 1),
  (45, 62, 21, 62, 21, 0, 1),
  (45, 78, 19, 78, 19, 0, 1),
  (45, 67, 36, 67, 36, 0, 1),
  (45, 24, 86, 24, 86, 0, 1),
  (45, 48, 57, 48, 57, 0, 1),
  (45, 45, 70, 45, 70, 0, 1),
  (45, 19, 125, 19, 125, 0, 1),
  (45, 49, 8, 49, 8, 0, 1),
  (45, 46, 20, 46, 20, 0, 1),
  (45, 39, 35, 39, 35, 0, 1),
  (45, 37, 50, 37, 50, 0, 1),
  (45, 20, 75, 20, 75, 0, 1),
  (45, 63, 44, 63, 44, 0, 1),
  (45, 68, 52, 68, 52, 0, 1),
  (45, 49, 64, 49, 64, 0, 1),
  (45, 29, 52, 29, 52, 0, 1),
  (46, 46, 21, 46, 21, 0, 1),
  (46, 48, 9, 48, 9, 0, 1),
  (46, 50, 65, 50, 65, 0, 1),
  (46, 51, 70, 51, 70, 0, 1),
  (46, 80, 33, 80, 33, 0, 1),
  (46, 62, 17, 62, 17, 0, 1),
  (46, 61, 11, 61, 11, 0, 1),
  (46, 69, 19, 69, 19, 0, 1),
  (46, 75, 15, 75, 15, 0, 1),
  (46, 83, 15, 83, 15, 0, 1),
  (46, 84, 21, 84, 21, 0, 1),
  (46, 67, 27, 67, 27, 0, 1),
  (46, 59, 34, 59, 34, 0, 1),
  (46, 86, 37, 86, 37, 0, 1),
  (46, 78, 44, 78, 44, 0, 1),
  (46, 71, 52, 71, 52, 0, 1),
  (46, 65, 59, 65, 59, 0, 1),
  (46, 65, 51, 65, 51, 0, 1),
  (46, 55, 44, 55, 44, 0, 1),
  (46, 40, 48, 40, 48, 0, 1),
  (46, 31, 53, 31, 53, 0, 1),
  (46, 24, 90, 24, 90, 0, 1),
  (46, 21, 100, 21, 100, 0, 1),
  (46, 25, 105, 25, 105, 0, 1),
  (46, 30, 110, 30, 110, 0, 1),
  (46, 21, 118, 21, 118, 0, 1),
  (46, 38, 117, 38, 117, 0, 1),
  (46, 141, 11, 141, 11, 0, 1),
  (46, 127, 17, 127, 17, 0, 1),
  (46, 114, 26, 114, 26, 0, 1),
  (46, 107, 18, 107, 18, 0, 1),
  (46, 104, 13, 104, 13, 0, 1),
  (46, 115, 12, 115, 12, 0, 1),
  (46, 89, 62, 89, 62, 0, 1),
  (46, 75, 76, 75, 76, 0, 1),
  (46, 69, 87, 69, 87, 0, 1),
  (46, 50, 93, 50, 93, 0, 1),
  (46, 23, 72, 23, 72, 0, 1),
  (46, 78, 23, 78, 23, 0, 1),
  (46, 70, 38, 70, 38, 0, 1),
  (46, 55, 25, 55, 25, 0, 1),
  (46, 30, 122, 30, 122, 0, 1),
  (46, 17, 126, 17, 126, 0, 1),
  (46, 122, 29, 122, 29, 0, 1),
  (46, 108, 40, 108, 40, 0, 1),
  (48, 66, 222, 66, 222, 0, 1),
  (48, 63, 218, 63, 218, 0, 1),
  (48, 57, 225, 57, 225, 0, 1),
  (48, 171, 162, 171, 162, 0, 1),
  (48, 175, 169, 175, 169, 0, 1),
  (48, 178, 174, 178, 174, 0, 1),
  (48, 173, 179, 173, 179, 0, 1),
  (48, 171, 187, 171, 187, 0, 1),
  (48, 165, 193, 165, 193, 0, 1),
  (48, 159, 198, 159, 198, 0, 1),
  (48, 152, 201, 152, 201, 0, 1),
  (48, 144, 201, 144, 201, 0, 1),
  (48, 137, 205, 137, 205, 0, 1),
  (48, 124, 206, 124, 206, 0, 1),
  (48, 115, 210, 115, 210, 0, 1),
  (48, 104, 211, 104, 211, 0, 1),
  (48, 94, 210, 94, 210, 0, 1),
  (48, 87, 214, 87, 214, 0, 1),
  (48, 76, 215, 76, 215, 0, 1),
  (48, 47, 224, 47, 224, 0, 1),
  (48, 46, 217, 46, 217, 0, 1),
  (48, 29, 226, 29, 226, 0, 1),
  (48, 22, 213, 22, 213, 0, 1),
  (48, 24, 204, 24, 204, 0, 1),
  (48, 34, 200, 34, 200, 0, 1),
  (48, 35, 209, 35, 209, 0, 1),
  (48, 40, 210, 40, 210, 0, 1),
  (48, 45, 205, 45, 205, 0, 1),
  (48, 47, 211, 47, 211, 0, 1),
  (48, 37, 232, 37, 232, 0, 1),
  (48, 226, 52, 226, 52, 0, 1),
  (48, 22, 230, 22, 230, 0, 1),
  (48, 41, 224, 41, 224, 0, 1),
  (48, 82, 215, 82, 215, 0, 1),
  (48, 167, 156, 167, 156, 0, 1),
  (48, 177, 146, 177, 146, 0, 1),
  (52, 156, 156, 156, 156, 0, 1),
  (52, 162, 149, 162, 149, 0, 1),
  (52, 152, 169, 152, 169, 0, 1),
  (52, 72, 128, 72, 128, 0, 1),
  (52, 70, 138, 70, 138, 0, 1),
  (52, 61, 147, 61, 147, 0, 1),
  (52, 49, 158, 49, 158, 0, 1),
  (52, 33, 169, 33, 169, 0, 1),
  (52, 22, 173, 22, 173, 0, 1),
  (52, 55, 181, 55, 181, 0, 1),
  (52, 67, 186, 67, 186, 0, 1),
  (52, 73, 180, 73, 180, 0, 1),
  (52, 89, 184, 89, 184, 0, 1),
  (52, 101, 183, 101, 183, 0, 1),
  (52, 111, 183, 111, 183, 0, 1),
  (52, 122, 178, 122, 178, 0, 1),
  (52, 129, 171, 129, 171, 0, 1),
  (52, 138, 167, 138, 167, 0, 1),
  (52, 147, 164, 147, 164, 0, 1),
  (52, 170, 145, 170, 145, 0, 1),
  (52, 163, 138, 163, 138, 0, 1),
  (52, 53, 220, 53, 220, 0, 1),
  (52, 41, 222, 41, 222, 0, 1),
  (52, 29, 231, 29, 231, 0, 1),
  (52, 22, 232, 22, 232, 0, 1),
  (52, 27, 209, 27, 209, 0, 1),
  (52, 36, 205, 36, 205, 0, 1),
  (52, 109, 211, 109, 211, 0, 1),
  (52, 131, 207, 131, 207, 0, 1),
  (52, 155, 196, 155, 196, 0, 1),
  (52, 167, 154, 167, 154, 0, 1),
  (52, 177, 19, 177, 19, 0, 1),
  (52, 118, 167, 118, 167, 0, 1),
  (52, 111, 175, 111, 175, 0, 1),
  (52, 63, 178, 63, 178, 0, 1),
  (52, 162, 141, 162, 141, 0, 1),
  (52, 138, 176, 138, 176, 0, 1),
  (47, 41, 109, 41, 109, 0, 1),
  (47, 49, 100, 49, 100, 0, 1),
  (47, 54, 89, 54, 89, 0, 1),
  (47, 62, 87, 62, 87, 0, 1),
  (47, 71, 82, 71, 82, 0, 1),
  (47, 79, 70, 79, 70, 0, 1),
  (47, 85, 64, 85, 64, 0, 1),
  (47, 94, 60, 94, 60, 0, 1),
  (47, 101, 50, 101, 50, 0, 1),
  (47, 106, 48, 106, 48, 0, 1),
  (47, 112, 45, 112, 45, 0, 1),
  (47, 109, 38, 109, 38, 0, 1),
  (47, 118, 37, 118, 37, 0, 1),
  (47, 122, 29, 122, 29, 0, 1),
  (47, 119, 20, 119, 20, 0, 1),
  (47, 124, 14, 124, 14, 0, 1),
  (47, 133, 14, 133, 14, 0, 1),
  (47, 150, 14, 150, 14, 0, 1),
  (47, 161, 11, 161, 11, 0, 1),
  (47, 166, 16, 166, 16, 0, 1),
  (47, 171, 18, 171, 18, 0, 1),
  (47, 182, 14, 182, 14, 0, 1),
  (47, 190, 24, 190, 24, 0, 1),
  (47, 196, 27, 196, 27, 0, 1),
  (47, 200, 17, 200, 17, 0, 1),
  (47, 208, 9, 208, 9, 0, 1),
  (47, 218, 47, 218, 47, 0, 1),
  (47, 222, 14, 222, 14, 0, 1),
  (47, 117, 74, 117, 74, 0, 1),
  (47, 139, 61, 139, 61, 0, 1),
  (47, 152, 61, 152, 61, 0, 1),
  (47, 172, 55, 172, 55, 0, 1),
  (47, 189, 56, 189, 56, 0, 1),
  (47, 226, 46, 226, 46, 0, 1),
  (47, 240, 11, 240, 11, 0, 1),
  (47, 227, 16, 227, 16, 0, 1),
  (47, 152, 22, 152, 22, 0, 1),
  (47, 142, 15, 142, 15, 0, 1),
  (47, 128, 22, 128, 22, 0, 1),
  (47, 116, 9, 116, 9, 0, 1),
  (47, 113, 27, 113, 27, 0, 1),
  (47, 33, 108, 33, 108, 0, 1),
  (47, 35, 118, 35, 118, 0, 1),
  (51, 228, 16, 228, 16, 0, 1),
  (51, 237, 17, 237, 17, 0, 1),
  (51, 237, 26, 237, 26, 0, 1),
  (51, 238, 40, 238, 40, 0, 1),
  (51, 235, 48, 235, 48, 0, 1),
  (51, 230, 25, 230, 25, 0, 1),
  (51, 206, 55, 206, 55, 0, 1),
  (51, 200, 49, 200, 49, 0, 1),
  (51, 193, 52, 193, 52, 0, 1),
  (51, 184, 52, 184, 52, 0, 1),
  (51, 178, 58, 178, 58, 0, 1),
  (51, 170, 61, 170, 61, 0, 1),
  (51, 156, 59, 156, 59, 0, 1),
  (51, 144, 63, 144, 63, 0, 1),
  (51, 133, 61, 133, 61, 0, 1),
  (51, 133, 70, 133, 70, 0, 1),
  (51, 125, 78, 125, 78, 0, 1),
  (51, 118, 85, 118, 85, 0, 1),
  (51, 124, 90, 124, 90, 0, 1),
  (51, 116, 98, 116, 98, 0, 1),
  (51, 106, 101, 106, 101, 0, 1),
  (51, 99, 108, 99, 108, 0, 1),
  (51, 91, 115, 91, 115, 0, 1),
  (51, 81, 123, 81, 123, 0, 1),
  (51, 126, 167, 126, 167, 0, 1),
  (51, 111, 174, 111, 174, 0, 1),
  (51, 90, 177, 90, 177, 0, 1),
  (51, 76, 180, 76, 180, 0, 1),
  (51, 62, 178, 62, 178, 0, 1),
  (51, 42, 178, 42, 178, 0, 1),
  (51, 27, 161, 27, 161, 0, 1),
  (51, 42, 152, 42, 152, 0, 1),
  (51, 19, 159, 19, 159, 0, 1),
  (51, 62, 140, 62, 140, 0, 1),
  (51, 70, 133, 70, 133, 0, 1),
  (51, 168, 54, 168, 54, 0, 1),
  (51, 58, 40, 58, 40, 0, 1),
  (51, 225, 45, 225, 45, 0, 1),
  (51, 207, 9, 207, 9, 0, 1),
  (51, 154, 69, 154, 69, 0, 1),
  (51, 111, 82, 111, 82, 0, 1),
  (51, 81, 116, 81, 116, 0, 1),
  (51, 72, 125, 72, 125, 0, 1),
  (51, 122, 66, 122, 66, 0, 1),
  (51, 219, 56, 219, 56, 0, 1),
  (51, 215, 65, 215, 65, 0, 1),
  (51, 232, 55, 232, 55, 0, 1),
  (51, 231, 64, 231, 64, 0, 1),
  (51, 238, 71, 238, 71, 0, 1),
  (51, 229, 74, 229, 74, 0, 1),
  (51, 217, 75, 217, 75, 0, 1),
  (51, 225, 81, 225, 81, 0, 1),
  (51, 215, 86, 215, 86, 0, 1),
  (51, 223, 89, 223, 89, 0, 1),
  (51, 218, 101, 218, 101, 0, 1),
  (51, 232, 95, 232, 95, 0, 1),
  (52, 223, 70, 223, 70, 0, 1),
  (52, 211, 59, 211, 59, 0, 1),
  (52, 232, 86, 232, 86, 0, 1),
  (52, 208, 104, 208, 104, 0, 1),
  (52, 235, 106, 235, 106, 0, 1),
  (52, 224, 108, 224, 108, 0, 1),
  (48, 219, 124, 219, 124, 0, 1),
  (51, 225, 117, 225, 117, 0, 1),
  (48, 227, 123, 227, 123, 0, 1),
  (48, 219, 133, 219, 133, 0, 1),
  (48, 226, 134, 226, 134, 0, 1),
  (52, 224, 142, 224, 142, 0, 1),
  (48, 226, 154, 226, 154, 0, 1),
  (48, 221, 150, 221, 150, 0, 1),
  (48, 220, 168, 220, 168, 0, 1),
  (48, 232, 166, 232, 166, 0, 1),
  (48, 231, 176, 231, 176, 0, 1),
  (48, 217, 197, 217, 197, 0, 1),
  (48, 215, 182, 215, 182, 0, 1),
  (49, 211, 192, 211, 192, 0, 1),
  (52, 208, 183, 208, 183, 0, 1),
  (52, 215, 174, 215, 174, 0, 1),
  (48, 222, 190, 222, 190, 0, 1),
  (48, 229, 190, 229, 190, 0, 1),
  (52, 230, 181, 230, 181, 0, 1),
  (52, 226, 161, 226, 161, 0, 1),
  (52, 208, 198, 208, 198, 0, 1),
  (48, 232, 206, 232, 206, 0, 1),
  (48, 231, 196, 231, 196, 0, 1),
  (48, 223, 202, 223, 202, 0, 1),
  (48, 224, 184, 224, 184, 0, 1),
  (48, 230, 171, 230, 171, 0, 1),
  (48, 221, 158, 221, 158, 0, 1),
  (48, 233, 124, 233, 124, 0, 1),
  (48, 232, 102, 232, 102, 0, 1),
  (52, 200, 103, 200, 103, 0, 1),
  (52, 192, 101, 192, 101, 0, 1),
  (52, 179, 92, 179, 92, 0, 1),
  (52, 187, 94, 187, 94, 0, 1),
  (52, 177, 101, 177, 101, 0, 1),
  (52, 166, 117, 166, 117, 0, 1),
  (52, 159, 112, 159, 112, 0, 1),
  (52, 156, 122, 156, 122, 0, 1),
  (52, 173, 109, 173, 109, 0, 1),
  (52, 167, 107, 167, 107, 0, 1),
  (52, 150, 120, 150, 120, 0, 1),
  (52, 142, 125, 142, 125, 0, 1),
  (51, 136, 129, 136, 129, 0, 1),
  (52, 129, 130, 129, 130, 0, 1),
  (52, 117, 130, 117, 130, 0, 1),
  (52, 121, 135, 121, 135, 0, 1),
  (52, 144, 109, 144, 109, 0, 1),
  (52, 122, 144, 122, 144, 0, 1),
  (52, 112, 137, 112, 137, 0, 1),
  (52, 101, 147, 101, 147, 0, 1),
  (52, 97, 142, 97, 142, 0, 1),
  (52, 144, 132, 144, 132, 0, 1),
  (52, 93, 136, 93, 136, 0, 1),
  (52, 90, 148, 90, 148, 0, 1),
  (52, 124, 125, 124, 125, 0, 1),
  (52, 87, 132, 87, 132, 0, 1),
  (52, 86, 140, 86, 140, 0, 1),
  (52, 78, 145, 78, 145, 0, 1),
  (52, 79, 136, 79, 136, 0, 1),
  (52, 67, 147, 67, 147, 0, 1),
  (52, 71, 140, 71, 140, 0, 1),
  (52, 105, 137, 105, 137, 0, 1),
  (51, 83, 155, 83, 155, 0, 1),
  (52, 81, 164, 81, 164, 0, 1),
  (52, 70, 168, 70, 168, 0, 1),
  (52, 76, 174, 76, 174, 0, 1),
  (52, 85, 185, 85, 185, 0, 1),
  (52, 87, 175, 87, 175, 0, 1),
  (51, 65, 187, 65, 187, 0, 1),
  (51, 64, 159, 64, 159, 0, 1),
  (51, 186, 99, 186, 99, 0, 1),
  (51, 185, 90, 185, 90, 0, 1),
  (51, 147, 114, 147, 114, 0, 1),
  (51, 84, 170, 84, 170, 0, 1),
  (48, 15, 234, 15, 234, 0, 1),
  (48, 20, 237, 20, 237, 0, 1),
  (48, 34, 237, 34, 237, 0, 1),
  (48, 47, 231, 47, 231, 0, 1),
  (48, 54, 232, 54, 232, 0, 1),
  (48, 20, 218, 20, 218, 0, 1),
  (48, 34, 176, 34, 176, 0, 1)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '8 seconds', "MoveRange" = 2,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 45;
update config."MonsterAttribute" ma set "Value" = 43 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 2400 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 130 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 65 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 215 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 52 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 45 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '8 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 46;
update config."MonsterAttribute" ma set "Value" = 45 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 2800 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 135 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 145 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 70 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 225 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 58 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 46 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '8 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 5, "AttackDelay" = interval '1800 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 47;
update config."MonsterAttribute" ma set "Value" = 46 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 3200 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 150 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 75 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 230 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 64 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 47 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '15 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 3, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 48;
update config."MonsterAttribute" ma set "Value" = 70 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 9000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 240 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 270 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 180 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 350 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 115 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 48 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '86400 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 49;
update config."MonsterAttribute" ma set "Value" = 74 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 19000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 250 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 310 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 200 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 430 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 125 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 49 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '15 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 2, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 51;
update config."MonsterAttribute" ma set "Value" = 66 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 7000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 210 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 230 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 150 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 330 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 98 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 51 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '15 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 52;
update config."MonsterAttribute" ma set "Value" = 68 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 8000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 230 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 260 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 170 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 340 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 110 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 52 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (45), (46), (47), (48), (49), (51), (52)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   45 Bahamut
--   46 Vepar
--   47 Valkyrie
--   48 Lizard King
--   49 Hydra
--   51 Great Bahamut
--   52 Silver Valkyrie
