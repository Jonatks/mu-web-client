# Fase 2a: Master a 400 con la experiencia del S19. Lee Data/ExpSystem/MasterExp.xml y escribe master400.sql.
#   python3 ops/fase2/gen_master.py "<Data del servidor S19>" > ops/fase2/master400.sql
# OpenMU guarda en MasterExperienceTable[n] la experiencia acumulada para llegar al nivel n, desde una formula mXparser.
# Del 1 al 200 el S19 usa la misma formula que OpenMU; del 201 al 400 su tabla no sigue ninguna formula, asi que van
# como ramas de iff(). Pasado el 400 se repite el valor del 400 (OpenMU lee hasta MaximumMasterLevel + 1).
import re, sys

BASE = '(505 * level * level * level) + (35278500 * level) + (228045 * level * level)'
base = lambda n: 505 * n**3 + 35278500 * n + 228045 * n * n


def table(path):
    rows = [(int(l), int(a)) for l, a in re.findall(r'Level="(\d+)" Exp="\d+" AccumulatedExp="(\d+)"', open(path, encoding='utf-8-sig').read())]
    assert [l for l, _ in rows] == list(range(1, 401)), 'faltan niveles'
    return dict(rows)


def formula(acc):
    cut = next(n for n in range(1, 401) if acc[n] != base(n)) - 1
    branches = [f'level <= {cut}, {BASE}'] + [f'level = {n}, {acc[n]}' for n in range(cut + 1, 401)] + [f'level > 400, {acc[400]}']
    return 'iff(' + '; '.join(branches) + ')', cut


if __name__ == '__main__':
    acc = table(sys.argv[1] + '/ExpSystem/MasterExp.xml')
    f, cut = formula(acc)
    open(__file__.replace('gen_master.py', 'master_formula.txt'), 'w').write(f)
    rows = ',\n  '.join(', '.join(str(acc[n]) for n in range(i, min(i + 6, 401))) for i in range(cut + 1, 401, 6))
    open(__file__.replace('ops/fase2/gen_master.py', 'src/modules/skills/masterExpS19.ts'), 'w').write(
        f"// Experience to reach master levels {cut + 1} to 400 (Season 19 Data/ExpSystem/MasterExp.xml), from ops/fase2/gen_master.py.\n"
        f"// Up to {cut} the original's formula holds (masterLevel.ts); past it the server (master400.sql) uses this table.\n"
        f"export const MASTER_TABLE_FROM = {cut + 1};\nexport const MASTER_EXPERIENCE_S19: readonly number[] = [\n  {rows},\n];\n")
    print(f"""-- Fase 2a: nivel master maximo 400 con la experiencia del S19 (formula de OpenMU hasta el {cut}, tabla del S19 despues).
-- Generado por gen_master.py desde MasterExp.xml: no se edita a mano. Comprobar la formula antes con checkformula/.
-- Aplica con psql -v ON_ERROR_STOP=1 -f master400.sql; revierte con -v undo=1 (200 y la formula que tenia, la de OpenMU). Reiniciar OpenMU.
\\set ON_ERROR_STOP on
BEGIN;
\\if :{{?undo}}
UPDATE config."GameConfiguration" SET "MaximumMasterLevel" = 200, "MasterExperienceFormula" = '{BASE}';
\\else
UPDATE config."GameConfiguration" SET "MaximumMasterLevel" = 400, "MasterExperienceFormula" = '{f}';
\\endif
SELECT "MaximumMasterLevel", length(coalesce("MasterExperienceFormula", '')) FROM config."GameConfiguration";
COMMIT;""")
