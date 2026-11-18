\pset pager off
select 'CLASS', string_agg("Number"||'='||"Name"||(case when "IsMasterClass" then '*' else '' end), ' ' order by "Number") from config."CharacterClass";
select 'REF', i."Group"||':'||i."Number", split_part(i."Name",'||',1), i."Width"||'x'||i."Height", 'slot='||coalesce((select s."ItemSlots"::text from config."ItemSlotType" s where s."Id"=i."ItemSlotId"),'-'),
 '2h='||coalesce((select max(p."BaseValue") from config."ItemBasePowerUpDefinition" p join config."AttributeDefinition" a on a."Id"=p."TargetAttributeId" where p."ItemDefinitionId"=i."Id" and a."Designation" ilike '%two hand%')::text,'-'),
 'c='||coalesce((select string_agg(c."Number"::text,',' order by c."Number") from config."ItemDefinitionCharacterClass" x join config."CharacterClass" c on c."Id"=x."CharacterClassId" where x."ItemDefinitionId"=i."Id"),'')
from config."ItemDefinition" i
where (i."Group"=0 and i."Number" between 16 and 35) or (i."Group"=2 and i."Number">=14) or (i."Group"=4 and i."Number">=20) or (i."Group"=5 and i."Number">=20) or (i."Group"=6 and i."Number">=14)
   or (i."Group" between 7 and 11 and i."Number" between 25 and 73)
order by i."Group", i."Number";
select 'ATTR', a."Designation" from config."AttributeDefinition" a where a."Id" in (select "TargetAttributeId" from config."ItemBasePowerUpDefinition" union select "AttributeId" from config."AttributeRequirement") order by 2;
