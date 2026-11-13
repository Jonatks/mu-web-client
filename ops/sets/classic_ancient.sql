-- Fase 1: los 11 sets ancient clasicos (Mahes, Bragi, Alvis, Serket, Apis, Tyr, Khone, Surt, Harpy, Horus, Magni).
-- Generado por gen_classic_ancient.ts desde classic_ancient.ts: no se edita a mano.
-- Aplica con `psql -v ON_ERROR_STOP=1 -f classic_ancient.sql`; revierte con `-v undo=1`. Probar siempre primero en openmu_probe.
-- Una pieza que ya esta en otro set (los pendants y el Ring of Wind) entra con el discriminador siguiente (2).
\set ON_ERROR_STOP on
BEGIN;
\if :{?undo}
DELETE FROM config."ItemDefinitionItemSetGroup" WHERE "ItemSetGroupId"::text LIKE '0000ba5e-0001-001_-%' OR "ItemSetGroupId"::text LIKE '0000ba5e-0001-002_-%';
DELETE FROM config."ItemSetGroup" WHERE "Id"::text LIKE '0000ba5e-0001-001_-%' OR "Id"::text LIKE '0000ba5e-0001-002_-%'; -- borra en cascada ItemOfItemSet
DELETE FROM config."IncreasableItemOption" WHERE "Id"::text LIKE '0000ba5e-0005-001_-%' OR "Id"::text LIKE '0000ba5e-0005-002_-%';
DELETE FROM config."ItemOptionDefinition" WHERE "Id"::text LIKE '0000ba5e-0002-001_-%' OR "Id"::text LIKE '0000ba5e-0002-002_-%';
DELETE FROM config."PowerUpDefinition" WHERE "Id"::text LIKE '0000ba5e-0003-001_-%' OR "Id"::text LIKE '0000ba5e-0003-002_-%';
DELETE FROM config."PowerUpDefinitionValue" WHERE "Id"::text LIKE '0000ba5e-0004-001_-%' OR "Id"::text LIKE '0000ba5e-0004-002_-%';
\else
CREATE FUNCTION pg_temp.add_set(idx int, set_name text, piece_attr text, pieces uuid[], attrs text[], vals numeric[], aggs int[]) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  cfg uuid := '00000001-0001-0000-0000-000000000000';
  opt_type uuid := '436d820f-6d50-429d-af63-bb0f59567dd1'; -- mismo tipo que usan los demas sets
  hi int := 16 + idx;
  fmt text := '0000ba5e-%s-%s-0000-%s';
  grp uuid; optdef uuid; piece_bonus uuid; attr uuid; p uuid; n int; disc int;
  pwr uuid; val uuid;
BEGIN
  SELECT i."BonusOptionId" INTO piece_bonus
    FROM config."ItemOfItemSet" i
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
  -- Mahes (set 51)
  PERFORM pg_temp.add_set(0, 'Mahes', 'Total Strength',
    ARRAY['00000080-0009-0010-0000-000000000000', '00000080-0006-000c-0000-000000000000'],
    ARRAY['Maximum Health', 'Defense Ignore Chance', 'Defense Increase Multiplier With Equipped Shield'],
    ARRAY[100, 0.06, 0.17]::numeric[],
    ARRAY[0, 0, 0]);
  -- Bragi (set 52)
  PERFORM pg_temp.add_set(1, 'Bragi', 'Total Strength',
    ARRAY['00000080-0008-0011-0000-000000000000', '00000080-0009-0011-0000-000000000000', '00000080-0007-0011-0000-000000000000', '00000080-000b-0011-0000-000000000000', '00000080-0000-0011-0000-000000000000'],
    ARRAY['Total Strength', 'Total Strength', 'Total Strength', 'Maximum Health', 'Minimum Physical Base Damage', 'Two-Handed Weapon Physical Damage Increase (Ancient Option)', 'Double Damage Chance', 'Skill Damage Bonus'],
    ARRAY[10, 20, 30, 50, 30, 0.06, 0.03, 50]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0]);
  -- Alvis (set 53)
  PERFORM pg_temp.add_set(2, 'Alvis', 'Total Energy',
    ARRAY['00000080-0008-0012-0000-000000000000', '00000080-000a-0012-0000-000000000000', '00000080-000b-0012-0000-000000000000', '00000080-000d-001b-0000-000000000000', '00000080-0005-0009-0000-000000000000'],
    ARRAY['Double Damage Chance', 'Double Damage Chance', 'Double Damage Chance', 'Total Energy', 'Defense Ignore Chance', 'Critical Damage Chance', 'Excellent Damage Chance', 'Defense Increase Multiplier With Equipped Shield'],
    ARRAY[0.01, 0.02, 0.03, 10, 0.01, 0.08, 0.08, 0.08]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 0, 0, 0]);
  -- Serket (set 54)
  PERFORM pg_temp.add_set(3, 'Serket', 'Total Agility',
    ARRAY['00000080-0007-0024-0000-000000000000', '00000080-0009-0024-0000-000000000000'],
    ARRAY['Total Agility', 'Total Agility', 'Total Agility'],
    ARRAY[40, 90, 40]::numeric[],
    ARRAY[0, 0, 0]);
  -- Apis (set 55)
  PERFORM pg_temp.add_set(4, 'Apis', 'Total Strength',
    ARRAY['00000080-000b-0025-0000-000000000000', '00000080-000d-000d-0000-000000000000'],
    ARRAY['Maximum Physical Base Damage', 'Critical Damage Bonus', 'Excellent Damage Bonus'],
    ARRAY[60, 40, 40]::numeric[],
    ARRAY[0, 0, 0]);
  -- Tyr (set 56)
  PERFORM pg_temp.add_set(5, 'Tyr', 'Total Strength',
    ARRAY['00000080-0009-0014-0000-000000000000', '00000080-000a-0014-0000-000000000000', '00000080-000b-0014-0000-000000000000', '00000080-000d-000c-0000-000000000000', '00000080-0000-001f-0000-000000000000'],
    ARRAY['Total Strength', 'Total Agility', 'Total Vitality', 'Total Energy', 'Double Damage Chance', 'Wizardry Base Damage Increase', 'Two-Handed Weapon Physical Damage Increase (Ancient Option)', 'Excellent Damage Chance'],
    ARRAY[20, 20, 20, 20, 0.01, 1.01, 0.06, 0.12]::numeric[],
    ARRAY[0, 0, 0, 0, 0, 1, 0, 0]);
  -- Khone (set 57)
  PERFORM pg_temp.add_set(6, 'Khone', 'Total Strength',
    ARRAY['00000080-000a-001b-0000-000000000000', '00000080-000b-001b-0000-000000000000'],
    ARRAY['Maximum Health', 'Critical Damage Chance', 'Excellent Damage Chance'],
    ARRAY[200, 0.03, 0.03]::numeric[],
    ARRAY[0, 0, 0]);
  -- Surt (set 58)
  PERFORM pg_temp.add_set(7, 'Surt', 'Total Strength',
    ARRAY['00000080-0007-0026-0000-000000000000', '00000080-0008-0026-0000-000000000000', '00000080-000a-0026-0000-000000000000', '00000080-000b-0026-0000-000000000000', '00000080-0002-000b-0000-000000000000'],
    ARRAY['Defense Increase Multiplier With Equipped Shield', 'Base Defense', 'Total Strength', 'Maximum Health', 'Skill Damage Bonus', 'Critical Damage Bonus', 'Critical Damage Chance', 'Total Energy'],
    ARRAY[0.02, 20, 30, 70, 40, 80, 0.01, 60]::numeric[],
    ARRAY[0, 2, 0, 0, 0, 0, 0, 0]);
  -- Harpy (set 59)
  PERFORM pg_temp.add_set(8, 'Harpy', 'Total Energy',
    ARRAY['00000080-0008-0029-0000-000000000000', '00000080-000b-0029-0000-000000000000'],
    ARRAY['Total Agility', 'Defense Ignore Chance', 'Base Defense'],
    ARRAY[10, 0.01, 40]::numeric[],
    ARRAY[0, 0, 2]);
  -- Horus (set 60)
  PERFORM pg_temp.add_set(9, 'Horus', 'Total Vitality',
    ARRAY['00000080-0000-0021-0000-000000000000', '00000080-000d-001c-0000-000000000000'],
    ARRAY['Minimum Physical Base Damage', 'Skill Damage Bonus', 'Double Damage Chance'],
    ARRAY[80, 60, 0.04]::numeric[],
    ARRAY[0, 0, 0]);
  -- Magni (set 61)
  PERFORM pg_temp.add_set(10, 'Magni', 'Total Vitality',
    ARRAY['00000080-0007-003d-0000-000000000000', '00000080-0008-003d-0000-000000000000', '00000080-000b-003d-0000-000000000000', '00000080-000d-0017-0000-000000000000', '00000080-0000-0022-0000-000000000000'],
    ARRAY['Maximum Physical Base Damage', 'Maximum Physical Base Damage', 'Maximum Physical Base Damage', 'Maximum Health', 'Base Defense', 'Excellent Damage Bonus', 'Excellent Damage Chance', 'Minimum Physical Base Damage'],
    ARRAY[5, 10, 20, 100, 50, 10, 0.08, 60]::numeric[],
    ARRAY[0, 0, 0, 0, 2, 0, 0, 0]);
END $$;
\endif
COMMIT;
