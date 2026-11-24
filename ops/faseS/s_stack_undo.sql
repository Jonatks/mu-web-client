begin;
update config."ItemDefinition" d set "Durability" = b."Durability" from mu_plugins.stack_bak_s19 b where b."Id" = d."Id";
drop table mu_plugins.stack_bak_s19;
commit;
