-- Solo lectura: columnas de las tablas de crafting y las mezclas del Chaos Goblin.
SELECT table_name, string_agg(column_name || ':' || data_type, ',' ORDER BY ordinal_position) FROM information_schema.columns
 WHERE table_schema = 'config' AND table_name ILIKE '%Craft%' GROUP BY table_name;
SELECT c."Number", c."ItemCraftingHandlerClassName", m."Number" FROM config."ItemCrafting" c JOIN config."MonsterDefinition" m ON m."Id" = c."MonsterDefinitionId" ORDER BY m."Number", c."Number";
SELECT "Id", "Number", "Group", "Name" FROM config."ItemDefinition" WHERE "Group" BETWEEN 7 AND 11 AND "Number" BETWEEN 98 AND 104 ORDER BY 3, 2;
SELECT "Id", "Name" FROM config."ItemDefinition" WHERE "Group" = 13 AND "Number" = 407;
