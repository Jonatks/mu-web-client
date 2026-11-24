-- Deshace s5_puertas.sql desde sus respaldos
begin;
update config."EnterGate" o set "X1" = b."X1", "Y1" = b."Y1", "X2" = b."X2", "Y2" = b."Y2", "LevelRequirement" = b."LevelRequirement" from mu_plugins."entergate_bak_s5" b where o."Id" = b."Id";
update config."ExitGate" o set "X1" = b."X1", "Y1" = b."Y1", "X2" = b."X2", "Y2" = b."Y2", "Direction" = b."Direction" from mu_plugins."exitgate_bak_s5" b where o."Id" = b."Id";
update config."WarpInfo" o set "Costs" = b."Costs", "LevelRequirement" = b."LevelRequirement" from mu_plugins."warpinfo_bak_s5" b where o."Id" = b."Id";
commit;
