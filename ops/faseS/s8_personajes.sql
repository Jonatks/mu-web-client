-- Fase S8: lo de los personajes que el S19 fija en Common.ini y CharacterBase.xml: zen maximo 2.000.000.000,
-- nivel 400 y maestro 400, y toda clase creable desde el nivel 1 (DarkLordCreateLevel=0, etc.).
-- Los 500 puntos y el zen inicial van en el plugin S19NewCharacter.
begin;
create schema if not exists mu_plugins;
create table if not exists mu_plugins.gameconfig_bak_s8 as select * from config."GameConfiguration";
create table if not exists mu_plugins.charclass_bak_s8 as select * from config."CharacterClass";
update config."GameConfiguration" set "MaximumInventoryMoney" = 2000000000, "MaximumLevel" = 400, "MaximumMasterLevel" = 400;
update config."CharacterClass" set "LevelRequirementByCreation" = 0 where "CanGetCreated";
commit;
