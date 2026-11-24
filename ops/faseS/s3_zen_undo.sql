-- Deshace s3_zen.sql desde su respaldo
update config."DropItemGroup" o set "Chance" = b."Chance" from mu_plugins.dropgroup_bak_s3zen b where o."Id" = b."Id";
