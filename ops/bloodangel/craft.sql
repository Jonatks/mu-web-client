-- Fase 3: la mezcla del Chaos Goblin (238) numero 200: pieza Bloodangel no ancient + Bloodangel Soul = la pieza ancient.
-- La hace el plugin BloodangelAncientCrafting (openmu/plugins/GameLogic/Craftings). 100 %, 1.000.000 Zen.
-- Tambien enlaza el drop del Soul a Medusa por nombre (soul.sql usaba un numero que no existe).
-- Aplica con psql -v ON_ERROR_STOP=1 -f craft.sql; revierte con -v undo=1. OpenMU se reinicia despues.
\set ON_ERROR_STOP on
BEGIN;
\if :{?undo}
DELETE FROM config."ItemCrafting" WHERE "Id"='0000ba5e-0008-0001-0000-000000000001';
DELETE FROM config."ItemCraftingRequiredItemItemDefinition" WHERE "ItemCraftingRequiredItemId"::text LIKE '0000ba5e-0008-0002-%';
DELETE FROM config."ItemCraftingRequiredItem" WHERE "Id"::text LIKE '0000ba5e-0008-0002-%';
DELETE FROM config."SimpleCraftingSettings" WHERE "Id"='0000ba5e-0008-0003-0000-000000000001';
DELETE FROM config."MonsterDefinitionDropItemGroup" WHERE "DropItemGroupId"='0000ba5e-0007-0002-0000-000000000001'
  AND "MonsterDefinitionId" IN (SELECT "Id" FROM config."MonsterDefinition" WHERE "Designation" ILIKE 'medusa%' AND "Number" NOT IN (275,459,561));
\else
INSERT INTO config."SimpleCraftingSettings" ("Id","Money","MoneyPerFinalSuccessPercentage","SuccessPercent","MaximumSuccessPercent","MultipleAllowed","ResultItemSelect",
  "SuccessPercentageAdditionForLuck","SuccessPercentageAdditionForExcellentItem","SuccessPercentageAdditionForAncientItem","SuccessPercentageAdditionForSocketItem",
  "ResultItemLuckOptionChance","ResultItemSkillChance","ResultItemExcellentOptionChance","ResultItemMaxExcOptionCount","NpcPriceDivisor","SuccessPercentageAdditionForGuardianItem")
  VALUES ('0000ba5e-0008-0003-0000-000000000001',1000000,0,100,100,false,0,0,0,0,0,0,0,0,0,0,0);
INSERT INTO config."ItemCraftingRequiredItem" ("Id","SimpleCraftingSettingsId","MinimumItemLevel","MaximumItemLevel","MinimumAmount","MaximumAmount","SuccessResult","FailResult","NpcPriceDivisor","AddPercentage","Reference")
  VALUES ('0000ba5e-0008-0002-0000-000000000001','0000ba5e-0008-0003-0000-000000000001',0,15,1,1,1,1,0,0,1),
         ('0000ba5e-0008-0002-0000-000000000002','0000ba5e-0008-0003-0000-000000000001',0,15,1,1,0,0,0,0,0);
INSERT INTO config."ItemCraftingRequiredItemItemDefinition"
  SELECT DISTINCT '0000ba5e-0008-0002-0000-000000000001'::uuid, "ItemDefinitionId" FROM config."ItemDefinitionItemSetGroup" WHERE "ItemSetGroupId"::text LIKE '0000ba5e-0001-004_-%';
INSERT INTO config."ItemCraftingRequiredItemItemDefinition" VALUES ('0000ba5e-0008-0002-0000-000000000002','00000080-000d-0197-0000-000000000000');
INSERT INTO config."ItemCrafting" ("Id","SimpleCraftingSettingsId","MonsterDefinitionId","Number","Name","ItemCraftingHandlerClassName")
  SELECT '0000ba5e-0008-0001-0000-000000000001','0000ba5e-0008-0003-0000-000000000001',"Id",200,'Bloodangel Ancient',
         'MUnique.OpenMU.GameLogic.Craftings.BloodangelAncientCrafting, MUnique.OpenMU.MuPlugins'
  FROM config."MonsterDefinition" WHERE "Number"=238;
INSERT INTO config."MonsterDefinitionDropItemGroup"
  SELECT "Id",'0000ba5e-0007-0002-0000-000000000001' FROM config."MonsterDefinition" m WHERE "Designation" ILIKE 'medusa%'
   AND NOT EXISTS (SELECT 1 FROM config."MonsterDefinitionDropItemGroup" d WHERE d."MonsterDefinitionId"=m."Id" AND d."DropItemGroupId"='0000ba5e-0007-0002-0000-000000000001');
SELECT count(*) || ' piezas en la mezcla' FROM config."ItemCraftingRequiredItemItemDefinition" WHERE "ItemCraftingRequiredItemId"='0000ba5e-0008-0002-0000-000000000001';
SELECT count(*) || ' jefes sueltan el Soul' FROM config."MonsterDefinitionDropItemGroup" WHERE "DropItemGroupId"='0000ba5e-0007-0002-0000-000000000001';
\endif
COMMIT;
