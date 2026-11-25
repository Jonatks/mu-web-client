-- Las 4 bolsas del inventario para todos los personajes y el baul ampliado para todas las cuentas (decision del
-- dueno, 24-11-2026; en el S19 se compran en la tienda de cash). Los nuevos los da el plugin S19NewCharacter.
begin;
create schema if not exists mu_plugins;
create table if not exists mu_plugins.bolsas_bak_s11 as select "Id", "InventoryExtensions" from data."Character";
create table if not exists mu_plugins.baul_bak_s11 as select "Id", "IsVaultExtended" from data."Account";
update data."Character" set "InventoryExtensions" = 4 where "InventoryExtensions" < 4;
update data."Account" set "IsVaultExtended" = true where not "IsVaultExtended";
commit;
