-- Fase S3 (zen): OpenMU deja de soltar su zen (grupo de dinero, 50% por muerte con el zen de la experiencia); el
-- plugin S19Drops suelta el del S19 (ItemDropRateControl.ini ZenDropRate y ZenDrop.xml).
begin;
create schema if not exists mu_plugins;
create table if not exists mu_plugins.dropgroup_bak_s3zen as select * from config."DropItemGroup" where "ItemType" = 5;
update config."DropItemGroup" set "Chance" = 0 where "ItemType" = 5;
commit;
