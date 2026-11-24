-- Fase S6: las mezclas de OpenMU que el S19 tambien tiene con otro costo o tasa (Data/Mix/Mix.xml, MaxRate1 = objeto
-- normal). Las demas (alas, Fenrir, pociones SD) ya coinciden con ChaosMix.ini; las del sistema nuevo del S19
-- (reliquias, nucleos de alas, cartas) no existen en OpenMU.
begin;
create schema if not exists mu_plugins;
create table if not exists mu_plugins.crafting_bak_s6 as select * from config."SimpleCraftingSettings";
update config."SimpleCraftingSettings" s set "Money" = v.money, "SuccessPercent" = v.rate
from config."ItemCrafting" c, (values (3, 2000000, 60), (4, 4000000, 55), (22, 6000000, 50), (23, 8000000, 45),
  (49, 10000000, 40), (50, 12000000, 30)) v(nr, money, rate)
where c."Number" = v.nr and s."Id" = c."SimpleCraftingSettingsId";
commit;
