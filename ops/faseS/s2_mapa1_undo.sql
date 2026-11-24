begin;
delete from config."MonsterSpawnArea" where "GameMapId" = (select "Id" from config."GameMapDefinition" where "Number" = 1) and "SpawnTrigger" in (0, 6);
insert into config."MonsterSpawnArea" select * from mu_plugins.spawn_bak_s2_m1;
update config."MonsterDefinition" d set "RespawnDelay" = b."RespawnDelay", "MoveRange" = b."MoveRange", "ViewRange" = b."ViewRange",
  "AttackRange" = b."AttackRange", "AttackDelay" = b."AttackDelay", "MoveDelay" = b."MoveDelay" from mu_plugins.monster_bak_s2_m1 b where b."Id" = d."Id";
update config."MonsterAttribute" ma set "Value" = b."Value" from mu_plugins.monster_bak_s2_m1_attr b where b."Id" = ma."Id";
drop table mu_plugins.spawn_bak_s2_m1; drop table mu_plugins.monster_bak_s2_m1; drop table mu_plugins.monster_bak_s2_m1_attr;
commit;
