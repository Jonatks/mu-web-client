\pset pager off
select table_name||': '||string_agg(column_name||' '||data_type, ', ' order by ordinal_position) from information_schema.columns where table_schema='config' and table_name in ('DropItemGroup','DropItemGroupItemDefinition','GameMapDefinitionDropItemGroup','MonsterDefinition','MonsterSpawnArea','ItemStorage','Item','MonsterDefinitionDropItemGroup','GameMapDefinition') group by table_name;
select 'MAP', "Number", split_part("Name",'||',1) from config."GameMapDefinition" where "Number" in (10,37,38,39,51,57,58,63) order by 1;
select 'DG', d."Description", d."Chance", d."MinimumMonsterLevel", d."MaximumMonsterLevel", d."ItemType", d."ItemLevel" from config."DropItemGroup" d order by d."Chance" desc limit 12;
select 'MAPDG', m."Number", d."Description" from config."GameMapDefinitionDropItemGroup" x join config."GameMapDefinition" m on m."Id"=x."GameMapDefinitionId" join config."DropItemGroup" d on d."Id"=x."DropItemGroupId" where m."Number" in (57,63,39);
select 'NPC', "Number", split_part("Designation",'||',1), "NpcWindow" from config."MonsterDefinition" where "NpcWindow" is not null and "NpcWindow" <> 0 order by 2 limit 60;
