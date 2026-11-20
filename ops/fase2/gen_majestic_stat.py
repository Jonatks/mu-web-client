# Fase 2c: el arbol de estadisticas Majestic del S19 (Skill/SkillTreeMajesticStat.xml y FormulaData.xml tipo 3) como
# codigo del plugin y del cliente, iguales entre si.
#   python3 ops/fase2/gen_majestic_stat.py "<Data del servidor S19>" <raiz de mu-web>
# Clases S19 0 a 6 = clases S6 (Number >> 2 en OpenMU). Lo que el S19 resuelve en su binario (a que estadistica va
# cada nodo) sale de STAT; lo provisional esta en ops/plan/bitacora.md.
import re, sys

data, root = sys.argv[1], sys.argv[2]
tree = open(data + '/Skill/SkillTreeMajesticStat.xml', encoding='utf-8-sig').read()
formulas = dict(re.findall(r'<Data Type="3" ID="(\d+)" Formula="([^"]+)"', open(data + '/FormulaData.xml', encoding='utf-8-sig').read()))
names = dict(re.findall(r'<Skill ID="(\d+)" Name="([^"]+)"', open(data + '/Skill/SkillList.xml', encoding='utf-8-sig').read()))

# Nodo -> atributos de OpenMU (Stats.*). "4th Stat" de la seccion 1 va a la estadistica principal de la clase.
MAIN = {0: 'TotalEnergy', 1: 'TotalStrength', 2: 'TotalAgility', 3: 'TotalStrength', 4: 'TotalLeadership', 5: 'TotalEnergy', 6: 'TotalStrength'}
STAT = {
    1137: ['MaximumHealth'], 1138: ['TotalVitality'], 1241: ['TotalVitality'], 1139: ['DefenseBase'], 1140: ['DefenseBase'],
    1141: ['PhysicalBaseDmg'], 1142: ['WizardryBaseDmg'], 1146: ['BaseDamageBonus'], 1157: ['WizardryBaseDmg', 'CurseBaseDmg'],
    1143: None, 1242: None, 1144: ['SkillDamageBonus'], 1145: ['PhysicalBaseDmg'], 1193: ['WizardryBaseDmg'],
    1194: ['BaseDamageBonus'], 1195: ['WizardryBaseDmg', 'CurseBaseDmg'],
}

def expr(fid):
    f = formulas[fid].replace('%d', 'p')
    # Una formula que no cambia con los puntos ("8+(p*0)") es por punto.
    return f'({f})*p' if eval(f, {'p': 1}) == eval(f, {'p': 2}) else f

classes = {}
for cls, body in re.findall(r'<Info Class="(\d+)">(.*?)</Info>', tree, re.S):
    if int(cls) > 6:
        continue
    nodes = []
    for a in re.findall(r'<Skill ([^>]+)/>', body):
        v = dict(re.findall(r'(\w+)="(\d+)"', a))
        nodes.append({k: int(x) for k, x in v.items()})
    nodes.sort(key=lambda n: n['Section'] * 4 + n['ID'])
    assert [n['Section'] * 4 + n['ID'] for n in nodes] == list(range(8)), cls
    assert all(n[f'ReqPoints{i}'] == 1 for n in nodes for i in (1, 2, 3))
    classes[int(cls)] = nodes

used = sorted({n[f'FormulaID{i}'] for ns in classes.values() for n in ns for i in (1, 2)})
skills = sorted({n['SkillID'] for ns in classes.values() for n in ns})

def stats(cls, sid):
    return STAT[sid] or [MAIN[cls]]

def row(cls, n, cs):
    tiers = ', '.join(f"{n[f'PointCondition{i}']}, {n[f'MaxPoints{i}']}" for i in (1, 2, 3))
    st = ', '.join(f'Stats.{s}' for s in stats(cls, n['SkillID'])) if cs else ', '.join(f"'{s}'" for s in stats(cls, n['SkillID']))
    if cs:
        return f"new({n['SkillID']}, [{tiers}], {n['EndPoint1']}, {n['FormulaID1']}, {n['FormulaID2']}, [{st}])"
    return f"{{ skill: {n['SkillID']}, tiers: [{tiers}], end1: {n['EndPoint1']}, f1: {n['FormulaID1']}, f2: {n['FormulaID2']}, stats: [{st}] }}"

cs_classes = '\n'.join(f'        [ // {c}\n' + ''.join(f'            {row(c, n, True)},\n' for n in ns) + '        ],' for c, ns in sorted(classes.items()))
cs_formulas = '\n'.join(f'        {fid} => {expr(str(fid))},' for fid in used)
open(root + '/openmu/plugins/GameLogic/Majestic/MajesticStatTree.cs', 'w').write(f"""// <copyright file="MajesticStatTree.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Majestic;

using MUnique.OpenMU.AttributeSystem;
using MUnique.OpenMU.GameLogic.Attributes;

/// <summary>
/// The Majestic stat tree of Season 19 (Skill/SkillTreeMajesticStat.xml, FormulaData.xml type 3), made by mu-web-client
/// ops/fase2/gen_majestic_stat.py. Eight nodes per class: section * 4 + id.
/// </summary>
public static class MajesticStatTree
{{
    /// <summary>Nodes per class.</summary>
    public const int NodeCount = 8;

    /// <summary>The nodes of each class, by OpenMU class number / 4.</summary>
    private static readonly Node[][] Classes =
    [
{cs_classes}
    ];

    /// <summary>The nodes of a character class (OpenMU number), or null when it has none.</summary>
    public static Node[]? Of(int classNumber) => classNumber >> 2 is var i && i < Classes.Length ? Classes[i] : null;

    /// <summary>The value of a formula at <paramref name="p"/> points.</summary>
    public static float Formula(int id, int p) => id switch
    {{
{cs_formulas}
        _ => 0,
    }};

    /// <summary>One node: the Majestic level that opens each tier and its top, and the attributes it raises.</summary>
    public sealed record Node(int Skill, int[] Tiers, int End1, int Formula1, int Formula2, AttributeDefinition[] Stats)
    {{
        /// <summary>The most points the node takes at a Majestic level.</summary>
        public int Cap(int majesticLevel)
        {{
            var cap = 0;
            for (var i = 0; i < this.Tiers.Length; i += 2)
            {{
                if (majesticLevel >= this.Tiers[i])
                {{
                    cap = this.Tiers[i + 1];
                }}
            }}

            return cap;
        }}

        /// <summary>What the node adds at <paramref name="points"/> points.</summary>
        public float Value(int points) => points <= 0 ? 0 : MajesticStatTree.Formula(points <= this.End1 ? this.Formula1 : this.Formula2, points);
    }}
}}
""")

ts_classes = '\n'.join('  [\n' + ''.join(f'    {row(c, n, False)},\n' for n in ns) + '  ],' for c, ns in sorted(classes.items()))
ts_formulas = '\n'.join(f'  {fid}: (p: number) => {expr(str(fid))},' for fid in used)
ts_names = '\n'.join(f"  {s}: '{names[str(s)]}'," for s in skills)
open(root + '/src/modules/skills/majesticStatTree.ts', 'w').write(f"""/**
 * The Majestic stat tree of Season 19 (Skill/SkillTreeMajesticStat.xml, FormulaData.xml type 3), made by
 * ops/fase2/gen_majestic_stat.py, the same as the plugin's MajesticStatTree.cs. Eight nodes per class: section * 4 + id.
 */

export interface MajesticStatNode {{
  skill: number;
  /** Majestic level that opens a tier, then its top: three pairs. */
  tiers: number[];
  end1: number;
  f1: number;
  f2: number;
  stats: string[];
}}

const FORMULAS: Record<number, (p: number) => number> = {{
{ts_formulas}
}};

/** The S19 names (SkillList.xml); the window shows them as they are. */
export const MAJESTIC_STAT_NAMES: Record<number, string> = {{
{ts_names}
}};

/** By OpenMU class number / 4 (the client's class code >> 2 the same way). */
const CLASSES: MajesticStatNode[][] = [
{ts_classes}
];

export const majesticStatNodes = (classIndex: number): MajesticStatNode[] => CLASSES[classIndex] ?? [];

/** The most points the node takes at a Majestic level. */
export function majesticStatCap(node: MajesticStatNode, level: number): number {{
  let cap = 0;
  for (let i = 0; i < node.tiers.length; i += 2) if (level >= node.tiers[i]) cap = node.tiers[i + 1];
  return cap;
}}

/** What the node adds at `points` points. */
export const majesticStatValue = (node: MajesticStatNode, points: number): number =>
  points <= 0 ? 0 : FORMULAS[points <= node.end1 ? node.f1 : node.f2](points);
""")
print('ok', len(classes), 'clases', len(used), 'formulas')
