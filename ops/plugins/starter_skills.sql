-- Habilidades iniciales: AddClassSkillsOnCreate las da por clase, asi que los 9 plugins "Add ... For ..." de OpenMU sobran.
-- Aplica con `psql -v ON_ERROR_STOP=1 -f starter_skills.sql`; revierte con `-v undo=1`. OpenMU se reinicia despues.
-- Tambien suma Lunge (20) y Uppercut (21) a la lista del Magic Gladiator.
BEGIN;
\if :{?undo}
UPDATE config."PlugInConfiguration" SET "IsActive" = true WHERE "TypeId" IN (
  '53f23ddd-3676-4d24-8dff-2ef657255832', '2bb94d35-0def-4458-84ac-ecaae6e896be', '6a721fed-51cd-41ad-ba7c-ec1642fff00a',
  '49d2d6f2-4e70-4f4b-b7ce-0645ec2f094a', 'd197321f-1bac-4a82-8548-13674af6d82c', 'ac326833-d60e-4705-a7df-740fa37acba8',
  'd83347db-4d33-47e9-b898-5edb2777b8a1', '83b0d163-7e97-40fc-851a-d5500b4bb33e', '5ac4f8c8-8b4c-4dd6-b1cf-d4f6491dc17a');
UPDATE config."PlugInConfiguration" SET "CustomConfiguration" = replace("CustomConfiguration", '[20,21,41,47,55,236]', '[41,47,55,236]')
  WHERE "TypeId" = '7d2c9e41-5b6a-4f83-a1d0-3e8b64c5f9a2';
\else
UPDATE config."PlugInConfiguration" SET "IsActive" = false WHERE "TypeId" IN (
  '53f23ddd-3676-4d24-8dff-2ef657255832', '2bb94d35-0def-4458-84ac-ecaae6e896be', '6a721fed-51cd-41ad-ba7c-ec1642fff00a',
  '49d2d6f2-4e70-4f4b-b7ce-0645ec2f094a', 'd197321f-1bac-4a82-8548-13674af6d82c', 'ac326833-d60e-4705-a7df-740fa37acba8',
  'd83347db-4d33-47e9-b898-5edb2777b8a1', '83b0d163-7e97-40fc-851a-d5500b4bb33e', '5ac4f8c8-8b4c-4dd6-b1cf-d4f6491dc17a');
-- La configuracion es JSON de .NET con espacios y saltos; se reescribe compacta para que el reemplazo sea seguro.
UPDATE config."PlugInConfiguration"
   SET "CustomConfiguration" = replace(regexp_replace("CustomConfiguration", '\s', '', 'g'), '"$values":[41,47,55,236]', '"$values":[20,21,41,47,55,236]')
 WHERE "TypeId" = '7d2c9e41-5b6a-4f83-a1d0-3e8b64c5f9a2';
\endif
COMMIT;
