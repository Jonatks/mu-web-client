-- Una sola habilidad inicial por clase (decision del propietario, 13 nov). Reinicia OpenMU despues. Reversa: -v undo=1 vuelve a las listas largas.
BEGIN;
\if :{?undo}
UPDATE config."PlugInConfiguration" SET "CustomConfiguration" =
 '{"$id":"1","SkillsByClass":{"0":{"$id":"3","$values":[17]},"4":{"$id":"4","$values":[44,19,20,21,22,23]},"8":{"$id":"5","$values":[46,24,26,27,30,28]},"12":{"$id":"6","$values":[20,21,41,47,55,236]},"16":{"$id":"7","$values":[60]},"20":{"$id":"8","$values":[]},"24":{"$id":"9","$values":[260,261,269,270]},"$id":"2"}}'
 WHERE "TypeId" = '7d2c9e41-5b6a-4f83-a1d0-3e8b64c5f9a2';
\else
UPDATE config."PlugInConfiguration" SET "CustomConfiguration" =
 '{"$id":"1","SkillsByClass":{"0":{"$id":"3","$values":[17]},"4":{"$id":"4","$values":[19]},"8":{"$id":"5","$values":[24]},"12":{"$id":"6","$values":[56]},"16":{"$id":"7","$values":[60]},"20":{"$id":"8","$values":[]},"24":{"$id":"9","$values":[260]},"$id":"2"}}'
 WHERE "TypeId" = '7d2c9e41-5b6a-4f83-a1d0-3e8b64c5f9a2';
\endif
COMMIT;
