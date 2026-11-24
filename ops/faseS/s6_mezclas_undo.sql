-- Deshace s6_mezclas.sql desde su respaldo
update config."SimpleCraftingSettings" o set "Money" = b."Money", "SuccessPercent" = b."SuccessPercent"
from mu_plugins.crafting_bak_s6 b where o."Id" = b."Id";
