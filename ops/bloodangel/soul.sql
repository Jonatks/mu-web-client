-- Fase 3: el Bloodangel Soul (13/407) y su drop en jefes (Kundun 275, Selupan 459, Medusa 561, que no existe: ver craft.sql), 30 %.
-- Aplica con psql -v ON_ERROR_STOP=1 -f soul.sql; revierte con -v undo=1. OpenMU se reinicia despues.
\set ON_ERROR_STOP on
BEGIN;
\if :{?undo}
DELETE FROM config."MonsterDefinitionDropItemGroup" WHERE "DropItemGroupId"='0000ba5e-0007-0002-0000-000000000001';
DELETE FROM config."DropItemGroupItemDefinition" WHERE "DropItemGroupId"='0000ba5e-0007-0002-0000-000000000001';
DELETE FROM config."DropItemGroup" WHERE "Id"='0000ba5e-0007-0002-0000-000000000001';
DELETE FROM config."ItemDefinitionCharacterClass" WHERE "ItemDefinitionId"='00000080-000d-0197-0000-000000000000';
DELETE FROM config."ItemDefinition" WHERE "Id"='00000080-000d-0197-0000-000000000000';
\else
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM config."ItemDefinition" WHERE "Group"=13 AND "Number"=407) THEN RAISE EXCEPTION '13/407 ya existe'; END IF;
END $$;
INSERT INTO config."ItemDefinition" ("Id","ItemSlotId","ConsumeEffectId","SkillId","GameConfigurationId","Number","Width","Height","DropsFromMonsters","IsAmmunition","IsBoundToCharacter","Name","DropLevel","MaximumItemLevel","Durability","Group","Value","MaximumSockets","PetExperienceFormula","StorageLimitPerCharacter","MaximumDropLevel","IsQuestItem","IsDroppable","IsPersonalStoreSellable","IsRepairable","IsSellableToNpc","IsStorable","IsTradable","IntroducedIn","IsActive","PriceDefinitionId","ExcellentBonus","ExcellentRaisesLevel","StatProfileId")
  SELECT '00000080-000d-0197-0000-000000000000',"ItemSlotId",NULL,NULL,"GameConfigurationId",407,2,2,false,false,false,'Bloodangel Soul',0,0,1,13,"Value","MaximumSockets",NULL,"StorageLimitPerCharacter","MaximumDropLevel",false,true,true,false,false,true,true,"IntroducedIn","IsActive","PriceDefinitionId",0,false,NULL
  FROM config."ItemDefinition" WHERE "Group"=13 AND "Number"=16;
INSERT INTO config."ItemDefinitionCharacterClass" SELECT '00000080-000d-0197-0000-000000000000', "CharacterClassId" FROM config."ItemDefinitionCharacterClass" WHERE "ItemDefinitionId"=(SELECT "Id" FROM config."ItemDefinition" WHERE "Group"=13 AND "Number"=16);
INSERT INTO config."DropItemGroup" ("Id","GameConfigurationId","Description","Chance","ItemType") VALUES ('0000ba5e-0007-0002-0000-000000000001','00000001-0001-0000-0000-000000000000','Bloodangel Soul (jefes)',0.3,0);
INSERT INTO config."DropItemGroupItemDefinition" VALUES ('0000ba5e-0007-0002-0000-000000000001','00000080-000d-0197-0000-000000000000');
INSERT INTO config."MonsterDefinitionDropItemGroup" SELECT "Id",'0000ba5e-0007-0002-0000-000000000001' FROM config."MonsterDefinition" WHERE "Number" IN (275,459,561);
SELECT count(*) || ' jefes sueltan el Soul' FROM config."MonsterDefinitionDropItemGroup" WHERE "DropItemGroupId"='0000ba5e-0007-0002-0000-000000000001';
\endif
COMMIT;
