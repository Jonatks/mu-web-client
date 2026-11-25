-- Deshace s9_npcs.sql
begin;
delete from config."MonsterSpawnArea" where "Id"::text like '0000ba5e-001a-%';
delete from config."MonsterDefinition" where "Id"::text like '0000ba5e-0018-%';
delete from data."ItemStorage" where "Id"::text like '0000ba5e-0019-%';
commit;
