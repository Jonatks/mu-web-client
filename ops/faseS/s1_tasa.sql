-- Fase S1: tasas de experiencia del S19 (ExpSystem.xml StaicExp: Normal 200, Master 2000; Majestic toma la master).
begin;
create table if not exists mu_plugins.gameconfig_bak_s1 as select "Id","ExperienceRate","MasterExperienceRate" from config."GameConfiguration";
update config."GameConfiguration" set "ExperienceRate" = 200, "MasterExperienceRate" = 2000;
commit;
