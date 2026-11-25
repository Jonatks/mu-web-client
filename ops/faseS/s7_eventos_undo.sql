-- Deshace s7_eventos.sql
update config."PlugInConfiguration" o set "CustomConfiguration" = b."CustomConfiguration" from mu_plugins.plugin_bak_s7 b where o."Id" = b."Id";
