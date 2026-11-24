-- Fase S2, mapa 1: monstruos y NPC del S19. Hecho por ops/faseS/gen_map.py.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.spawn_bak_s2_m1 as select s.* from config."MonsterSpawnArea" s where s."GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 1) and s."SpawnTrigger" in (0, 6);
create table mu_plugins.monster_bak_s2_m1 as select "Id", "RespawnDelay", "MoveRange", "ViewRange", "AttackRange", "AttackDelay", "MoveDelay" from config."MonsterDefinition" where "Number" in (5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 34, 36, 37, 39, 40, 41, 681);
create table mu_plugins.monster_bak_s2_m1_attr as select ma."Id", ma."Value" from config."MonsterAttribute" ma join config."MonsterDefinition" d on d."Id" = ma."MonsterDefinitionId" where d."Number" in (5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 34, 36, 37, 39, 40, 41, 681);
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 1) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" ("Id", "GameMapId", "MonsterDefinitionId", "X1", "Y1", "X2", "Y2", "Direction", "Quantity", "SpawnTrigger", "WaveNumber")
select gen_random_uuid(), (select "Id" from config."GameMapDefinition" where "Number" = 1), d."Id", v.x1, v.y1, v.x2, v.y2, v.dir, v.q,
  coalesce((select b."SpawnTrigger" from mu_plugins.spawn_bak_s2_m1 b where b."MonsterDefinitionId" = d."Id" limit 1), 0), 0
from (values
  (101, 10, 26, 10, 26, 2, 1),
  (101, 11, 26, 11, 26, 2, 1),
  (101, 27, 12, 27, 12, 2, 1),
  (101, 24, 5, 24, 5, 2, 1),
  (101, 24, 4, 24, 4, 2, 1),
  (101, 27, 11, 27, 11, 2, 1),
  (101, 23, 24, 23, 24, 2, 1),
  (101, 27, 21, 27, 21, 2, 1),
  (101, 19, 19, 19, 19, 2, 1),
  (101, 22, 24, 22, 24, 2, 1),
  (101, 23, 29, 23, 29, 2, 1),
  (101, 23, 28, 23, 28, 2, 1),
  (101, 33, 9, 33, 9, 2, 1),
  (101, 35, 9, 35, 9, 2, 1),
  (101, 39, 18, 39, 18, 2, 1),
  (101, 39, 17, 39, 17, 2, 1),
  (101, 39, 16, 39, 16, 2, 1),
  (102, 45, 224, 45, 224, 4, 1),
  (101, 48, 193, 48, 193, 2, 1),
  (101, 49, 193, 49, 193, 2, 1),
  (102, 66, 71, 66, 71, 4, 1),
  (102, 80, 61, 80, 61, 2, 1),
  (101, 90, 164, 90, 164, 2, 1),
  (101, 92, 164, 92, 164, 2, 1),
  (101, 91, 164, 91, 164, 2, 1),
  (100, 126, 99, 126, 99, 2, 1),
  (100, 123, 99, 123, 99, 2, 1),
  (100, 120, 99, 120, 99, 2, 1),
  (100, 117, 99, 117, 99, 2, 1),
  (100, 136, 95, 136, 95, 2, 1),
  (100, 139, 95, 139, 95, 2, 1),
  (101, 128, 212, 128, 212, 2, 1),
  (101, 130, 213, 130, 213, 2, 1),
  (101, 143, 214, 143, 214, 2, 1),
  (101, 155, 230, 155, 230, 6, 1),
  (100, 172, 12, 172, 12, 2, 1),
  (100, 166, 12, 166, 12, 2, 1),
  (102, 169, 12, 169, 12, 2, 1),
  (102, 175, 12, 175, 12, 2, 1),
  (100, 178, 12, 178, 12, 2, 1),
  (100, 177, 103, 177, 103, 2, 1),
  (100, 180, 103, 180, 103, 2, 1),
  (100, 183, 103, 183, 103, 2, 1),
  (100, 186, 103, 186, 103, 2, 1),
  (100, 189, 103, 189, 103, 2, 1),
  (100, 186, 151, 186, 151, 4, 1),
  (100, 196, 33, 196, 33, 2, 1),
  (100, 193, 33, 193, 33, 2, 1),
  (100, 202, 93, 202, 93, 2, 1),
  (100, 205, 93, 205, 93, 2, 1),
  (100, 198, 130, 198, 130, 2, 1),
  (100, 202, 150, 202, 150, 2, 1),
  (100, 232, 46, 232, 46, 4, 1),
  (100, 232, 40, 232, 40, 4, 1),
  (100, 232, 37, 232, 37, 4, 1),
  (100, 227, 61, 227, 61, 2, 1),
  (100, 229, 93, 229, 93, 2, 1),
  (100, 232, 93, 232, 93, 2, 1),
  (14, 101, 219, 101, 219, 0, 5),
  (12, 84, 190, 84, 190, 0, 5),
  (17, 51, 233, 51, 233, 0, 5),
  (11, 50, 155, 50, 155, 0, 5),
  (5, 175, 119, 175, 119, 0, 5),
  (15, 131, 118, 131, 118, 0, 5),
  (13, 116, 75, 116, 75, 0, 5),
  (16, 225, 89, 255, 89, 0, 5),
  (9, 236, 14, 236, 14, 0, 5),
  (8, 117, 31, 117, 31, 0, 5),
  (10, 66, 119, 66, 119, 0, 5),
  (8, 11, 60, 11, 60, 0, 5),
  (36, 211, 96, 211, 96, 0, 5),
  (39, 201, 35, 201, 35, 0, 5),
  (34, 212, 138, 212, 138, 0, 5),
  (41, 162, 129, 162, 129, 0, 5),
  (37, 162, 106, 162, 106, 0, 5),
  (40, 162, 28, 162, 28, 0, 5),
  (681, 110, 22, 130, 54, 0, 1),
  (681, 171, 6, 199, 34, 0, 1),
  (681, 231, 37, 250, 72, 0, 1),
  (681, 3, 208, 30, 230, 0, 1),
  (681, 40, 219, 56, 249, 0, 1),
  (681, 236, 146, 250, 177, 0, 1),
  (681, 151, 146, 174, 171, 0, 1),
  (681, 233, 190, 252, 231, 0, 1),
  (681, 79, 231, 101, 249, 0, 1),
  (681, 99, 141, 124, 171, 0, 1),
  (681, 105, 176, 131, 206, 0, 1),
  (681, 149, 224, 182, 251, 0, 1),
  (681, 186, 217, 205, 251, 0, 1),
  (681, 210, 221, 230, 253, 0, 1),
  (681, 34, 3, 70, 21, 0, 1),
  (681, 82, 1, 128, 14, 0, 1),
  (681, 77, 85, 98, 126, 0, 1),
  (681, 107, 109, 152, 130, 0, 1),
  (681, 162, 113, 204, 131, 0, 1),
  (681, 212, 107, 241, 130, 0, 1),
  (681, 218, 4, 251, 25, 0, 1),
  (681, 42, 146, 55, 202, 0, 1),
  (681, 185, 144, 223, 194, 0, 1),
  (681, 142, 181, 180, 210, 0, 1),
  (681, 143, 12, 164, 49, 0, 1),
  (681, 130, 85, 190, 105, 0, 1),
  (681, 202, 80, 243, 95, 0, 1),
  (681, 62, 145, 92, 173, 0, 1),
  (681, 61, 180, 92, 203, 0, 1),
  (681, 108, 66, 123, 100, 0, 1),
  (681, 64, 44, 97, 72, 0, 1),
  (681, 11, 55, 46, 81, 0, 1),
  (681, 3, 102, 35, 125, 0, 1),
  (681, 83, 212, 138, 227, 0, 1),
  (8, 30, 122, 30, 122, 0, 1),
  (8, 40, 98, 40, 98, 0, 1),
  (8, 4, 73, 4, 73, 0, 1),
  (8, 12, 56, 12, 56, 0, 1),
  (8, 2, 78, 2, 78, 0, 1),
  (16, 108, 9, 108, 9, 0, 1),
  (14, 120, 232, 120, 232, 0, 1),
  (14, 107, 230, 107, 230, 0, 1),
  (12, 65, 205, 65, 205, 0, 1),
  (14, 84, 244, 84, 244, 0, 1),
  (15, 61, 169, 61, 169, 0, 1),
  (14, 94, 242, 94, 242, 0, 1),
  (14, 108, 195, 108, 195, 0, 1),
  (14, 94, 208, 94, 208, 0, 1),
  (11, 69, 167, 69, 167, 0, 1),
  (12, 87, 177, 87, 177, 0, 1),
  (11, 136, 149, 136, 149, 0, 1),
  (12, 70, 195, 70, 195, 0, 1),
  (14, 62, 181, 62, 181, 0, 1),
  (12, 61, 213, 61, 213, 0, 1),
  (11, 133, 212, 133, 212, 0, 1),
  (12, 69, 222, 69, 222, 0, 1),
  (12, 57, 247, 57, 247, 0, 1),
  (12, 49, 246, 49, 246, 0, 1),
  (14, 31, 247, 31, 247, 0, 1),
  (14, 3, 246, 3, 246, 0, 1),
  (14, 29, 246, 29, 246, 0, 1),
  (14, 83, 198, 83, 198, 0, 1),
  (17, 18, 220, 18, 220, 0, 1),
  (14, 33, 209, 33, 209, 0, 1),
  (11, 135, 212, 135, 212, 0, 1),
  (12, 86, 196, 86, 196, 0, 1),
  (11, 151, 212, 151, 212, 0, 1),
  (11, 168, 220, 168, 220, 0, 1),
  (12, 46, 210, 46, 210, 0, 1),
  (14, 45, 201, 45, 201, 0, 1),
  (12, 46, 205, 46, 205, 0, 1),
  (11, 46, 146, 46, 146, 0, 1),
  (11, 49, 182, 49, 182, 0, 1),
  (11, 44, 162, 44, 162, 0, 1),
  (11, 45, 180, 45, 180, 0, 1),
  (11, 45, 183, 45, 183, 0, 1),
  (11, 164, 232, 164, 232, 0, 1),
  (12, 137, 241, 137, 241, 0, 1),
  (12, 130, 244, 130, 244, 0, 1),
  (11, 92, 157, 92, 157, 0, 1),
  (11, 102, 174, 102, 174, 0, 1),
  (11, 113, 166, 113, 166, 0, 1),
  (15, 217, 229, 217, 229, 0, 1),
  (11, 222, 223, 222, 223, 0, 1),
  (11, 163, 184, 163, 184, 0, 1),
  (11, 164, 186, 164, 186, 0, 1),
  (17, 230, 173, 230, 173, 0, 1),
  (17, 236, 167, 236, 167, 0, 1),
  (11, 150, 193, 150, 193, 0, 1),
  (11, 142, 218, 142, 218, 0, 1),
  (12, 134, 240, 134, 240, 0, 1),
  (17, 241, 173, 241, 173, 0, 1),
  (11, 199, 116, 199, 116, 0, 1),
  (5, 170, 126, 170, 126, 0, 1),
  (14, 120, 243, 120, 243, 0, 1),
  (11, 240, 247, 240, 247, 0, 1),
  (11, 242, 247, 242, 247, 0, 1),
  (11, 241, 226, 241, 226, 0, 1),
  (11, 246, 220, 246, 220, 0, 1),
  (11, 243, 201, 243, 201, 0, 1),
  (5, 163, 114, 163, 114, 0, 1),
  (11, 244, 192, 244, 192, 0, 1),
  (11, 213, 248, 213, 248, 0, 1),
  (17, 173, 200, 173, 200, 0, 1),
  (11, 148, 149, 148, 149, 0, 1),
  (5, 163, 125, 163, 125, 0, 1),
  (15, 141, 110, 141, 110, 0, 1),
  (5, 145, 118, 145, 118, 0, 1),
  (13, 112, 93, 112, 93, 0, 1),
  (15, 98, 54, 98, 54, 0, 1),
  (14, 99, 49, 99, 49, 0, 1),
  (13, 104, 65, 104, 65, 0, 1),
  (13, 183, 27, 183, 27, 0, 1),
  (8, 187, 15, 187, 15, 0, 1),
  (8, 158, 17, 158, 17, 0, 1),
  (16, 159, 41, 159, 41, 0, 1),
  (16, 115, 8, 115, 8, 0, 1),
  (5, 123, 120, 123, 120, 0, 1),
  (15, 114, 110, 114, 110, 0, 1),
  (15, 68, 110, 68, 110, 0, 1),
  (15, 76, 111, 76, 111, 0, 1),
  (16, 124, 20, 124, 20, 0, 1),
  (16, 90, 6, 90, 6, 0, 1),
  (13, 114, 20, 114, 20, 0, 1),
  (5, 138, 86, 138, 86, 0, 1),
  (16, 212, 83, 212, 83, 0, 1),
  (16, 211, 90, 211, 90, 0, 1),
  (16, 226, 58, 226, 58, 0, 1),
  (16, 239, 56, 239, 56, 0, 1),
  (16, 235, 23, 235, 23, 0, 1),
  (13, 247, 87, 247, 87, 0, 1),
  (11, 247, 7, 247, 7, 0, 1),
  (11, 240, 7, 240, 7, 0, 1),
  (11, 241, 9, 241, 9, 0, 1),
  (9, 28, 18, 28, 18, 0, 1),
  (9, 22, 4, 22, 4, 0, 1),
  (9, 34, 4, 34, 4, 0, 1),
  (8, 119, 47, 119, 47, 0, 1),
  (9, 22, 90, 22, 90, 0, 1),
  (9, 33, 78, 33, 78, 0, 1),
  (8, 25, 100, 25, 100, 0, 1),
  (16, 29, 80, 29, 80, 0, 1),
  (9, 42, 117, 42, 117, 0, 1),
  (10, 14, 107, 14, 107, 0, 1),
  (8, 21, 82, 21, 82, 0, 1),
  (10, 22, 65, 22, 65, 0, 1),
  (10, 39, 77, 39, 77, 0, 1),
  (10, 29, 66, 29, 66, 0, 1),
  (8, 16, 55, 16, 55, 0, 1),
  (8, 35, 55, 35, 55, 0, 1),
  (8, 116, 47, 116, 47, 0, 1),
  (8, 122, 46, 122, 46, 0, 1),
  (8, 193, 30, 193, 30, 0, 1),
  (5, 120, 75, 120, 75, 0, 1),
  (13, 149, 94, 149, 94, 0, 1),
  (5, 81, 58, 81, 58, 0, 1),
  (13, 126, 94, 126, 94, 0, 1),
  (5, 71, 53, 71, 53, 0, 1),
  (5, 69, 88, 69, 88, 0, 1),
  (16, 86, 105, 86, 105, 0, 1),
  (16, 88, 104, 88, 104, 0, 1),
  (5, 98, 111, 98, 111, 0, 1),
  (15, 156, 125, 156, 125, 0, 1),
  (17, 165, 171, 165, 171, 0, 1),
  (17, 208, 162, 208, 162, 0, 1),
  (17, 220, 161, 220, 161, 0, 1),
  (17, 176, 188, 176, 188, 0, 1),
  (17, 168, 150, 168, 150, 0, 1),
  (17, 156, 171, 156, 171, 0, 1),
  (17, 176, 161, 176, 161, 0, 1),
  (17, 185, 161, 185, 161, 0, 1),
  (17, 181, 171, 181, 171, 0, 1),
  (17, 198, 168, 198, 168, 0, 1),
  (17, 190, 172, 190, 172, 0, 1),
  (11, 227, 248, 227, 248, 0, 1),
  (11, 181, 246, 181, 246, 0, 1),
  (14, 152, 247, 152, 247, 0, 1),
  (17, 128, 232, 128, 232, 0, 1),
  (14, 156, 247, 156, 247, 0, 1),
  (12, 193, 224, 193, 224, 0, 1),
  (12, 194, 222, 194, 222, 0, 1),
  (12, 194, 221, 194, 221, 0, 1),
  (11, 86, 150, 86, 150, 0, 1),
  (11, 98, 145, 98, 145, 0, 1),
  (12, 79, 154, 79, 154, 0, 1),
  (12, 78, 189, 78, 189, 0, 1),
  (14, 97, 187, 97, 187, 0, 1),
  (14, 105, 208, 105, 208, 0, 1),
  (14, 85, 208, 85, 208, 0, 1),
  (14, 84, 220, 84, 220, 0, 1),
  (14, 85, 229, 85, 229, 0, 1),
  (12, 100, 198, 100, 198, 0, 1),
  (12, 95, 192, 95, 192, 0, 1),
  (12, 90, 187, 90, 187, 0, 1),
  (14, 68, 227, 68, 227, 0, 1),
  (14, 61, 238, 61, 238, 0, 1),
  (14, 73, 245, 73, 245, 0, 1),
  (12, 73, 241, 73, 241, 0, 1),
  (14, 3, 232, 3, 232, 0, 1),
  (14, 3, 219, 3, 219, 0, 1),
  (14, 7, 219, 7, 219, 0, 1),
  (14, 17, 211, 17, 211, 0, 1),
  (17, 13, 235, 13, 235, 0, 1),
  (17, 27, 236, 27, 236, 0, 1),
  (11, 45, 188, 45, 188, 0, 1),
  (11, 53, 188, 53, 188, 0, 1),
  (11, 52, 166, 52, 166, 0, 1),
  (11, 62, 154, 62, 154, 0, 1),
  (11, 70, 154, 70, 154, 0, 1),
  (11, 77, 152, 77, 152, 0, 1),
  (11, 110, 145, 110, 145, 0, 1),
  (11, 119, 146, 119, 146, 0, 1),
  (11, 120, 159, 120, 159, 0, 1),
  (11, 111, 188, 111, 188, 0, 1),
  (11, 125, 195, 125, 195, 0, 1),
  (11, 135, 196, 135, 196, 0, 1),
  (11, 144, 187, 144, 187, 0, 1),
  (11, 125, 218, 125, 218, 0, 1),
  (17, 143, 232, 143, 232, 0, 1),
  (17, 50, 211, 50, 211, 0, 1),
  (11, 197, 245, 197, 245, 0, 1),
  (11, 247, 211, 247, 211, 0, 1),
  (11, 231, 186, 231, 186, 0, 1),
  (11, 223, 187, 223, 187, 0, 1),
  (11, 213, 186, 213, 186, 0, 1),
  (11, 209, 175, 209, 175, 0, 1),
  (15, 193, 148, 193, 148, 0, 1),
  (15, 188, 145, 188, 145, 0, 1),
  (15, 206, 152, 206, 152, 0, 1),
  (15, 212, 151, 212, 151, 0, 1),
  (17, 220, 172, 220, 172, 0, 1),
  (17, 247, 168, 247, 168, 0, 1),
  (15, 247, 176, 247, 176, 0, 1),
  (17, 52, 222, 52, 222, 0, 1),
  (17, 50, 235, 50, 235, 0, 1),
  (17, 38, 234, 38, 234, 0, 1),
  (17, 16, 227, 16, 227, 0, 1),
  (17, 25, 220, 25, 220, 0, 1),
  (17, 235, 108, 235, 108, 0, 1),
  (17, 228, 105, 228, 105, 0, 1),
  (17, 214, 116, 214, 116, 0, 1),
  (11, 183, 128, 183, 128, 0, 1),
  (15, 175, 127, 175, 127, 0, 1),
  (15, 175, 118, 175, 118, 0, 1),
  (15, 183, 123, 183, 123, 0, 1),
  (5, 87, 114, 87, 114, 0, 1),
  (5, 65, 127, 65, 127, 0, 1),
  (15, 68, 125, 68, 125, 0, 1),
  (15, 80, 97, 80, 97, 0, 1),
  (5, 70, 76, 70, 76, 0, 1),
  (13, 168, 96, 168, 96, 0, 1),
  (13, 196, 100, 196, 100, 0, 1),
  (16, 240, 77, 240, 77, 0, 1),
  (16, 247, 77, 247, 77, 0, 1),
  (16, 248, 20, 248, 20, 0, 1),
  (16, 244, 9, 244, 9, 0, 1),
  (16, 229, 11, 229, 11, 0, 1),
  (8, 205, 24, 205, 24, 0, 1),
  (16, 155, 32, 155, 32, 0, 1),
  (16, 137, 33, 137, 33, 0, 1),
  (16, 122, 29, 122, 29, 0, 1),
  (9, 118, 11, 118, 11, 0, 1),
  (16, 48, 11, 48, 11, 0, 1),
  (9, 38, 23, 38, 23, 0, 1),
  (9, 160, 10, 160, 10, 0, 1),
  (9, 194, 18, 194, 18, 0, 1),
  (9, 213, 12, 213, 12, 0, 1),
  (9, 221, 14, 221, 14, 0, 1),
  (9, 243, 16, 243, 16, 0, 1),
  (9, 233, 66, 233, 66, 0, 1),
  (8, 39, 112, 39, 112, 0, 1),
  (8, 26, 111, 26, 111, 0, 1),
  (8, 15, 113, 15, 113, 0, 1),
  (8, 12, 97, 12, 97, 0, 1),
  (8, 44, 56, 44, 56, 0, 1),
  (10, 41, 88, 41, 88, 0, 1),
  (10, 19, 120, 19, 120, 0, 1),
  (10, 37, 98, 37, 98, 0, 1),
  (9, 30, 105, 30, 105, 0, 1),
  (9, 27, 53, 27, 53, 0, 1),
  (9, 10, 68, 10, 68, 0, 1),
  (9, 33, 90, 33, 90, 0, 1),
  (9, 12, 121, 12, 121, 0, 1),
  (18, 26, 67, 26, 67, 0, 1),
  (5, 70, 60, 70, 60, 0, 1),
  (5, 72, 69, 72, 69, 0, 1),
  (5, 74, 87, 74, 87, 0, 1),
  (5, 90, 59, 90, 59, 0, 1),
  (10, 9, 66, 9, 66, 0, 1),
  (10, 7, 113, 7, 113, 0, 1),
  (10, 38, 114, 38, 114, 0, 1),
  (10, 16, 60, 16, 60, 0, 1),
  (10, 10, 99, 10, 99, 0, 1),
  (10, 18, 79, 18, 79, 0, 1),
  (10, 41, 62, 41, 62, 0, 1),
  (10, 31, 117, 31, 117, 0, 1),
  (10, 10, 85, 10, 85, 0, 1),
  (13, 112, 76, 112, 76, 0, 1),
  (13, 111, 66, 111, 66, 0, 1),
  (13, 137, 91, 137, 91, 0, 1),
  (13, 145, 91, 145, 91, 0, 1),
  (13, 158, 96, 158, 96, 0, 1),
  (13, 175, 100, 175, 100, 0, 1),
  (13, 120, 95, 120, 95, 0, 1),
  (13, 112, 86, 112, 86, 0, 1),
  (13, 118, 74, 118, 74, 0, 1),
  (14, 83, 239, 83, 239, 0, 1),
  (14, 89, 236, 89, 236, 0, 1),
  (14, 97, 236, 97, 236, 0, 1),
  (14, 91, 247, 91, 247, 0, 1),
  (14, 98, 219, 98, 219, 0, 1),
  (14, 98, 211, 98, 211, 0, 1),
  (14, 79, 230, 79, 230, 0, 1),
  (14, 89, 222, 89, 222, 0, 1),
  (14, 87, 217, 87, 217, 0, 1),
  (15, 157, 117, 157, 117, 0, 1),
  (15, 210, 158, 210, 158, 0, 1),
  (15, 182, 160, 182, 160, 0, 1),
  (16, 233, 66, 233, 66, 0, 1),
  (16, 237, 14, 237, 14, 0, 1),
  (16, 243, 18, 243, 18, 0, 1),
  (16, 245, 71, 245, 71, 0, 1)
) as v(n, x1, y1, x2, y2, dir, q) join config."MonsterDefinition" d on d."Number" = v.n;
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1200 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 5;
update config."MonsterAttribute" ma set "Value" = 38 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1400 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 125 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 130 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 55 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 190 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 45 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 5 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 8;
update config."MonsterAttribute" ma set "Value" = 46 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 2500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 145 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 150 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 75 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 230 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 61 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 8 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '2200 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 9;
update config."MonsterAttribute" ma set "Value" = 44 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 2000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 145 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 70 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 220 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 55 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 9 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 10;
update config."MonsterAttribute" ma set "Value" = 48 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 3000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 150 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 155 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 240 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 70 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 10 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 11;
update config."MonsterAttribute" ma set "Value" = 32 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 110 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 115 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 40 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 160 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 39 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 11 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1800 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 12;
update config."MonsterAttribute" ma set "Value" = 25 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 750 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 90 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 95 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 31 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 125 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 31 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 12 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 13;
update config."MonsterAttribute" ma set "Value" = 40 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1600 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 130 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 135 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 60 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 200 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 47 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 13 and a."Designation" = 'Defense Rate (PvM)';
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
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 7, "AttackRange" = 5, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 15;
update config."MonsterAttribute" ma set "Value" = 34 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 115 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 120 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 45 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 170 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 41 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 15 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 2,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 16;
update config."MonsterAttribute" ma set "Value" = 42 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1800 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 135 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 65 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 210 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 49 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 16 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 4, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 17;
update config."MonsterAttribute" ma set "Value" = 28 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 850 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 105 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 35 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 140 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 35 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 17 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '86400 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 18;
update config."MonsterAttribute" ma set "Value" = 55 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 6000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 165 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 175 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 100 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 275 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 82 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 18 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 34;
update config."MonsterAttribute" ma set "Value" = 54 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 4000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 160 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 170 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 95 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 270 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 80 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 34 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 36;
update config."MonsterAttribute" ma set "Value" = 47 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 2800 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 148 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 153 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 78 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 235 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 67 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 36 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 4, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 37;
update config."MonsterAttribute" ma set "Value" = 60 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 5000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 180 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 195 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 115 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 300 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 88 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 37 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 5, "AttackRange" = 1, "AttackDelay" = interval '1400 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 39;
update config."MonsterAttribute" ma set "Value" = 50 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 3500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 155 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 160 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 85 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 250 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 73 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 39 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 1, "AttackDelay" = interval '1800 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 40;
update config."MonsterAttribute" ma set "Value" = 62 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 5500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 190 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 200 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 120 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 310 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 91 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 40 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '10 seconds', "MoveRange" = 3,
  "ViewRange" = 7, "AttackRange" = 1, "AttackDelay" = interval '1600 milliseconds',
  "MoveDelay" = interval '400 milliseconds' where "Number" = 41;
update config."MonsterAttribute" ma set "Value" = 57 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 4500 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 170 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 180 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 110 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 285 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 85 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 41 and a."Designation" = 'Defense Rate (PvM)';
update config."MonsterDefinition" set "RespawnDelay" = interval '120 seconds', "MoveRange" = 6,
  "ViewRange" = 10, "AttackRange" = 2, "AttackDelay" = interval '2000 milliseconds',
  "MoveDelay" = interval '800 milliseconds' where "Number" = 681;
update config."MonsterAttribute" ma set "Value" = 1 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Level';
update config."MonsterAttribute" ma set "Value" = 1000 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Maximum Health';
update config."MonsterAttribute" ma set "Value" = 35 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Minimum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 60 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Maximum Physical Base Damage';
update config."MonsterAttribute" ma set "Value" = 21 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Base Defense';
update config."MonsterAttribute" ma set "Value" = 10 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Attack Rate (PvM)';
update config."MonsterAttribute" ma set "Value" = 300 from config."MonsterDefinition" d, config."AttributeDefinition" a
  where d."Id" = ma."MonsterDefinitionId" and a."Id" = ma."AttributeDefinitionId" and d."Number" = 681 and a."Designation" = 'Defense Rate (PvM)';
select 'sin definicion en la base', v.n from (values (5), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (34), (36), (37), (39), (40), (41), (100), (101), (102), (681)) v(n)
  where not exists (select 1 from config."MonsterDefinition" d where d."Number" = v.n);
commit;
-- Monstruos y NPC del S19 en este mapa:
--   5 Hellhound
--   8 Poison Bull Fighter
--   9 Thunder Lich
--   10 Dark Knight
--   11 Ghost
--   12 Larva
--   13 Hell Spider
--   14 Skeleton
--   15 Skeleton Archer
--   16 Chief Skeleton Warrior
--   17 Cyclops
--   18 Gorgon
--   34 Cursed Wizard
--   36 Shadow
--   37 Devil
--   39 Poison Shadow
--   40 Death Knight
--   41 Death Cow
--   100 Lance
--   101 Iron Stick
--   102 Fire
--   681 Evomon
