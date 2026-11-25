-- Deshace s11_bolsas.sql desde sus respaldos
update data."Character" o set "InventoryExtensions" = b."InventoryExtensions" from mu_plugins.bolsas_bak_s11 b where o."Id" = b."Id";
update data."Account" o set "IsVaultExtended" = b."IsVaultExtended" from mu_plugins.baul_bak_s11 b where o."Id" = b."Id";
