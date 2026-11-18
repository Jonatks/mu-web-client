-- Fase 3: los 7 sets Bloodangel. Generado por gen_sets.ts desde sets_s19.json: no se edita a mano.
-- Aplica con `psql -v ON_ERROR_STOP=1 -f sets.sql`; revierte con `-v undo=1`. Probar siempre primero en openmu_probe.
\set ON_ERROR_STOP on
BEGIN;
\if :{?undo}
DELETE FROM config."ItemDefinitionItemSetGroup" WHERE "ItemSetGroupId"::text LIKE '0000ba5e-0001-004_-%';
DELETE FROM config."ItemSetGroup" WHERE "Id"::text LIKE '0000ba5e-0001-004_-%';
DELETE FROM config."IncreasableItemOption" WHERE "Id"::text LIKE '0000ba5e-0005-004_-%';
DELETE FROM config."ItemOptionDefinition" WHERE "Id"::text LIKE '0000ba5e-0002-004_-%';
DELETE FROM config."PowerUpDefinition" WHERE "Id"::text LIKE '0000ba5e-0003-004_-%';
DELETE FROM config."PowerUpDefinitionValue" WHERE "Id"::text LIKE '0000ba5e-0004-004_-%';
\else
CREATE FUNCTION pg_temp.add_set(hi int, set_name text, piece_attr text, pieces uuid[], attrs text[], vals numeric[], aggs int[]) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  cfg uuid := '00000001-0001-0000-0000-000000000000';
  opt_type uuid := '436d820f-6d50-429d-af63-bb0f59567dd1';
  fmt text := '0000ba5e-%s-%s-0000-%s';
  grp uuid; optdef uuid; piece_bonus uuid; attr uuid; p uuid; n int; disc int; pwr uuid; val uuid;
BEGIN
  SELECT i."BonusOptionId" INTO piece_bonus FROM config."ItemOfItemSet" i
    JOIN config."IncreasableItemOption" o ON o."Id" = i."BonusOptionId"
    JOIN config."PowerUpDefinition" pu ON pu."Id" = o."PowerUpDefinitionId"
    JOIN config."AttributeDefinition" a ON a."Id" = pu."TargetAttributeId"
   WHERE a."Designation" = piece_attr LIMIT 1;
  IF piece_bonus IS NULL THEN RAISE EXCEPTION 'no hay opcion de pieza con %', piece_attr; END IF;
  FOREACH p IN ARRAY pieces LOOP
    IF NOT EXISTS (SELECT 1 FROM config."ItemDefinition" WHERE "Id" = p) THEN RAISE EXCEPTION 'falta el item % de %', p, set_name; END IF;
  END LOOP;
  grp := format(fmt, '0001', lpad(to_hex(hi), 4, '0'), lpad('1', 12, '0'))::uuid;
  optdef := format(fmt, '0002', lpad(to_hex(hi), 4, '0'), lpad('1', 12, '0'))::uuid;
  INSERT INTO config."ItemOptionDefinition" ("Id", "GameConfigurationId", "Name", "AddsRandomly", "AddChance", "MaximumOptionsPerItem")
    VALUES (optdef, cfg, set_name || ' (Ancient Set)', false, 0, 1);
  FOR n IN 1..array_length(attrs, 1) LOOP
    SELECT "Id" INTO attr FROM config."AttributeDefinition" WHERE "Designation" = attrs[n];
    IF attr IS NULL THEN RAISE EXCEPTION 'no existe el atributo %', attrs[n]; END IF;
    val := format(fmt, '0004', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid;
    pwr := format(fmt, '0003', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid;
    INSERT INTO config."PowerUpDefinitionValue" ("Id", "Value", "AggregateType") VALUES (val, vals[n], aggs[n]);
    INSERT INTO config."PowerUpDefinition" ("Id", "TargetAttributeId", "BoostId") VALUES (pwr, attr, val);
    INSERT INTO config."IncreasableItemOption" ("Id", "OptionTypeId", "PowerUpDefinitionId", "ItemOptionDefinitionId", "Number", "SubOptionType", "LevelType", "Weight")
      VALUES (format(fmt, '0005', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid, opt_type, pwr, optdef, n, 0, 0, 0);
  END LOOP;
  INSERT INTO config."ItemSetGroup" ("Id", "GameConfigurationId", "Name", "AlwaysApplies", "CountDistinct", "MinimumItemCount", "SetLevel", "OptionsId")
    VALUES (grp, cfg, set_name, false, true, 2, 0, optdef);
  n := 0;
  FOREACH p IN ARRAY pieces LOOP
    n := n + 1;
    SELECT coalesce(max("AncientSetDiscriminator"), 0) + 1 INTO disc FROM config."ItemOfItemSet" WHERE "ItemDefinitionId" = p;
    INSERT INTO config."ItemOfItemSet" ("Id", "ItemSetGroupId", "ItemDefinitionId", "BonusOptionId", "AncientSetDiscriminator")
      VALUES (format(fmt, '0006', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid, grp, p, piece_bonus, disc);
    INSERT INTO config."ItemDefinitionItemSetGroup" ("ItemSetGroupId", "ItemDefinitionId") VALUES (grp, p);
  END LOOP;
END $f$;
DO $$
BEGIN
  -- Fury (S19 78, cliente 62)
  PERFORM pg_temp.add_set(64, 'Fury''s'::text, 'Total Strength'::text,
    ARRAY['00000080-0007-0062-0000-000000000000', '00000080-0008-0062-0000-000000000000', '00000080-0009-0062-0000-000000000000', '00000080-000b-0062-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Strength', 'Double Damage Chance', 'Minimum Physical Base Damage', 'Maximum Physical Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
  -- Transcendence (S19 80, cliente 63)
  PERFORM pg_temp.add_set(65, 'Transcendence''s'::text, 'Total Energy'::text,
    ARRAY['00000080-0007-0063-0000-000000000000', '00000080-0008-0063-0000-000000000000', '00000080-0009-0063-0000-000000000000', '00000080-000a-0063-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Energy', 'Double Damage Chance', 'Minimum Wizardry Base Damage', 'Maximum Wizardry Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
  -- Flurry (S19 82, cliente 64)
  PERFORM pg_temp.add_set(66, 'Flurry''s'::text, 'Total Agility'::text,
    ARRAY['00000080-0007-0064-0000-000000000000', '00000080-0008-0064-0000-000000000000', '00000080-0009-0064-0000-000000000000', '00000080-000a-0064-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Agility', 'Double Damage Chance', 'Minimum Physical Base Damage', 'Maximum Physical Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
  -- Honor (S19 84, cliente 65)
  PERFORM pg_temp.add_set(67, 'Honor''s'::text, 'Total Energy'::text,
    ARRAY['00000080-0007-0065-0000-000000000000', '00000080-0008-0065-0000-000000000000', '00000080-0009-0065-0000-000000000000', '00000080-000a-0065-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Energy', 'Double Damage Chance', 'Minimum Wizardry Base Damage', 'Maximum Wizardry Base Damage', 'Minimum Curse Base Damage', 'Maximum Curse Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
  -- Extremity (S19 86, cliente 66)
  PERFORM pg_temp.add_set(68, 'Extremity''s'::text, 'Total Strength'::text,
    ARRAY['00000080-0008-0066-0000-000000000000', '00000080-0009-0066-0000-000000000000', '00000080-000a-0066-0000-000000000000', '00000080-000b-0066-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Strength', 'Double Damage Chance', 'Minimum Physical Base Damage', 'Maximum Physical Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
  -- Conquest (S19 88, cliente 67)
  PERFORM pg_temp.add_set(69, 'Conquest''s'::text, 'Total Strength'::text,
    ARRAY['00000080-0007-0067-0000-000000000000', '00000080-0008-0067-0000-000000000000', '00000080-0009-0067-0000-000000000000', '00000080-000a-0067-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Strength', 'Double Damage Chance', 'Minimum Physical Base Damage', 'Maximum Physical Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
  -- Destruction (S19 90, cliente 68)
  PERFORM pg_temp.add_set(70, 'Destruction''s'::text, 'Total Vitality'::text,
    ARRAY['00000080-0007-0068-0000-000000000000', '00000080-0008-0068-0000-000000000000', '00000080-0009-0068-0000-000000000000', '00000080-000b-0068-0000-000000000000']::uuid[],
    ARRAY['Skill Damage Bonus', 'Total Strength', 'Double Damage Chance', 'Minimum Physical Base Damage', 'Maximum Physical Base Damage', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Ignore Chance', 'Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality', 'Base Defense', 'Critical Damage Bonus', 'Excellent Damage Bonus']::text[],
    ARRAY[25, 50, 0.1, 50, 50, 0.15, 0.15, 0.05, 10, 10, 10, 10, 20, 30, 30]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]::int[]);
END $$;
SELECT count(*) || ' sets Bloodangel' FROM config."ItemSetGroup" WHERE "Id"::text LIKE '0000ba5e-0001-004_-%';
\endif
COMMIT;
