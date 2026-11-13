-- Set piloto: Bes Eclipse (Dark Wizard, 2 piezas). Aplica con `psql -v ON_ERROR_STOP=1 -f bes_eclipse.sql`.
-- Revierte con `psql -v ON_ERROR_STOP=1 -v undo=1 -f bes_eclipse.sql`. Probar siempre primero en openmu_probe.
-- Bonus (guia no oficial, ajustables): Energia total +200 y Skill Damage Bonus +80 cuando estan las 2 piezas.
\set ON_ERROR_STOP on
BEGIN;
\if :{?undo}
DELETE FROM config."ItemSetGroup" WHERE "Id" = '0000ba5e-0001-0000-0000-000000000001'; -- borra en cascada ItemOfItemSet
DELETE FROM config."ItemDefinitionItemSetGroup" WHERE "ItemSetGroupId" = '0000ba5e-0001-0000-0000-000000000001';
DELETE FROM config."IncreasableItemOption" WHERE "ItemOptionDefinitionId" = '0000ba5e-0002-0000-0000-000000000001';
DELETE FROM config."ItemOptionDefinition" WHERE "Id" = '0000ba5e-0002-0000-0000-000000000001';
DELETE FROM config."PowerUpDefinition" WHERE "Id" IN ('0000ba5e-0003-0000-0000-000000000001', '0000ba5e-0003-0000-0000-000000000002');
DELETE FROM config."PowerUpDefinitionValue" WHERE "Id" IN ('0000ba5e-0004-0000-0000-000000000001', '0000ba5e-0004-0000-0000-000000000002');
\else
DO $$
DECLARE
  cfg uuid := '00000001-0001-0000-0000-000000000000';
  energy uuid := '12956b45-007c-453a-ae1f-36475b8cebbf';   -- Total Energy
  skilldmg uuid := 'b8b214b1-396b-4ca8-9a77-240aa70a989b'; -- Skill Damage Bonus
  opt_type uuid := '436d820f-6d50-429d-af63-bb0f59567dd1'; -- mismo tipo que usan los demas sets
  piece_bonus uuid;
BEGIN
  SELECT i."BonusOptionId" INTO piece_bonus
    FROM config."ItemOfItemSet" i
    JOIN config."IncreasableItemOption" o ON o."Id" = i."BonusOptionId"
    JOIN config."PowerUpDefinition" p ON p."Id" = o."PowerUpDefinitionId"
   WHERE p."TargetAttributeId" = energy LIMIT 1;
  IF piece_bonus IS NULL THEN RAISE EXCEPTION 'no hay opcion de pieza con Energia para copiar'; END IF;
  IF (SELECT count(*) FROM config."ItemDefinition" WHERE "Id" IN ('00000080-0009-0023-0000-000000000000', '00000080-0005-0008-0000-000000000000')) <> 2 THEN
    RAISE EXCEPTION 'faltan Eclipse Pants o Staff of Destruction';
  END IF;

  INSERT INTO config."PowerUpDefinitionValue" ("Id", "Value", "AggregateType") VALUES
    ('0000ba5e-0004-0000-0000-000000000001', 200, 0),
    ('0000ba5e-0004-0000-0000-000000000002', 80, 0);
  INSERT INTO config."PowerUpDefinition" ("Id", "TargetAttributeId", "BoostId") VALUES
    ('0000ba5e-0003-0000-0000-000000000001', energy, '0000ba5e-0004-0000-0000-000000000001'),
    ('0000ba5e-0003-0000-0000-000000000002', skilldmg, '0000ba5e-0004-0000-0000-000000000002');
  INSERT INTO config."ItemOptionDefinition" ("Id", "GameConfigurationId", "Name", "AddsRandomly", "AddChance", "MaximumOptionsPerItem")
    VALUES ('0000ba5e-0002-0000-0000-000000000001', cfg, 'Bes Eclipse (Ancient Set)', false, 0, 1);
  INSERT INTO config."IncreasableItemOption" ("Id", "OptionTypeId", "PowerUpDefinitionId", "ItemOptionDefinitionId", "Number", "SubOptionType", "LevelType", "Weight") VALUES
    ('0000ba5e-0005-0000-0000-000000000001', opt_type, '0000ba5e-0003-0000-0000-000000000001', '0000ba5e-0002-0000-0000-000000000001', 1, 0, 0, 0),
    ('0000ba5e-0005-0000-0000-000000000002', opt_type, '0000ba5e-0003-0000-0000-000000000002', '0000ba5e-0002-0000-0000-000000000001', 2, 0, 0, 0);
  INSERT INTO config."ItemSetGroup" ("Id", "GameConfigurationId", "Name", "AlwaysApplies", "CountDistinct", "MinimumItemCount", "SetLevel", "OptionsId")
    VALUES ('0000ba5e-0001-0000-0000-000000000001', cfg, 'Bes Eclipse', false, true, 2, 0, '0000ba5e-0002-0000-0000-000000000001');
  INSERT INTO config."ItemOfItemSet" ("Id", "ItemSetGroupId", "ItemDefinitionId", "BonusOptionId", "AncientSetDiscriminator") VALUES
    ('0000ba5e-0006-0000-0000-000000000001', '0000ba5e-0001-0000-0000-000000000001', '00000080-0009-0023-0000-000000000000', piece_bonus, 1),
    ('0000ba5e-0006-0000-0000-000000000002', '0000ba5e-0001-0000-0000-000000000001', '00000080-0005-0008-0000-000000000000', piece_bonus, 1);
  INSERT INTO config."ItemDefinitionItemSetGroup" ("ItemSetGroupId", "ItemDefinitionId") VALUES
    ('0000ba5e-0001-0000-0000-000000000001', '00000080-0009-0023-0000-000000000000'),
    ('0000ba5e-0001-0000-0000-000000000001', '00000080-0005-0008-0000-000000000000');
END $$;
\endif
COMMIT;
