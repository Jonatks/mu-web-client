-- Deshace s8_personajes.sql desde sus respaldos
update config."GameConfiguration" o set "MaximumInventoryMoney" = b."MaximumInventoryMoney", "MaximumLevel" = b."MaximumLevel",
  "MaximumMasterLevel" = b."MaximumMasterLevel" from mu_plugins.gameconfig_bak_s8 b where o."Id" = b."Id";
update config."CharacterClass" o set "LevelRequirementByCreation" = b."LevelRequirementByCreation"
from mu_plugins.charclass_bak_s8 b where o."Id" = b."Id";
