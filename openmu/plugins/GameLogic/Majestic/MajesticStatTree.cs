// <copyright file="MajesticStatTree.cs" company="MUnique">
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
{
    /// <summary>Nodes per class.</summary>
    public const int NodeCount = 8;

    /// <summary>The nodes of each class, by OpenMU class number / 4.</summary>
    private static readonly Node[][] Classes =
    [
        [ // 0
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1138, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1142, [10, 10, 35, 20, 60, 40], 30, 157, 224, [Stats.WizardryBaseDmg]),
            new(1143, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalEnergy]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1193, [60, 10, 100, 20, 140, 40], 30, 210, 210, [Stats.WizardryBaseDmg]),
        ],
        [ // 1
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1138, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1141, [10, 10, 35, 20, 60, 40], 30, 157, 224, [Stats.PhysicalBaseDmg]),
            new(1143, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalStrength]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1145, [60, 10, 100, 20, 140, 40], 30, 155, 155, [Stats.PhysicalBaseDmg]),
        ],
        [ // 2
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1138, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1141, [10, 10, 35, 20, 60, 40], 30, 157, 224, [Stats.PhysicalBaseDmg]),
            new(1143, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalAgility]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1145, [60, 10, 100, 20, 140, 40], 30, 155, 155, [Stats.PhysicalBaseDmg]),
        ],
        [ // 3
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1138, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1146, [10, 10, 35, 20, 60, 40], 30, 161, 224, [Stats.BaseDamageBonus]),
            new(1143, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalStrength]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1194, [60, 10, 100, 20, 140, 40], 30, 211, 211, [Stats.BaseDamageBonus]),
        ],
        [ // 4
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1241, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1141, [10, 10, 35, 20, 60, 40], 30, 157, 224, [Stats.PhysicalBaseDmg]),
            new(1242, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalLeadership]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1145, [60, 10, 100, 20, 140, 40], 30, 155, 155, [Stats.PhysicalBaseDmg]),
        ],
        [ // 5
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1138, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1157, [10, 10, 35, 20, 60, 40], 30, 157, 224, [Stats.WizardryBaseDmg, Stats.CurseBaseDmg]),
            new(1143, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalEnergy]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1195, [60, 10, 100, 20, 140, 40], 30, 212, 212, [Stats.WizardryBaseDmg, Stats.CurseBaseDmg]),
        ],
        [ // 6
            new(1137, [20, 10, 45, 20, 65, 40], 30, 152, 222, [Stats.MaximumHealth]),
            new(1138, [40, 10, 80, 20, 120, 40], 30, 153, 153, [Stats.TotalVitality]),
            new(1139, [60, 10, 100, 20, 140, 40], 30, 154, 223, [Stats.DefenseBase]),
            new(1140, [70, 10, 110, 20, 150, 40], 30, 160, 160, [Stats.DefenseBase]),
            new(1141, [10, 10, 35, 20, 60, 40], 30, 157, 224, [Stats.PhysicalBaseDmg]),
            new(1143, [30, 10, 70, 20, 110, 40], 30, 158, 158, [Stats.TotalStrength]),
            new(1144, [50, 10, 90, 20, 130, 40], 30, 159, 225, [Stats.SkillDamageBonus]),
            new(1145, [60, 10, 100, 20, 140, 40], 30, 155, 155, [Stats.PhysicalBaseDmg]),
        ],
    ];

    /// <summary>The nodes of a character class (OpenMU number), or null when it has none.</summary>
    public static Node[]? Of(int classNumber) => classNumber >> 2 is var i && i < Classes.Length ? Classes[i] : null;

    /// <summary>The value of a formula at <paramref name="p"/> points.</summary>
    public static float Formula(int id, int p) => id switch
    {
        152 => 70*p,
        153 => (8+(p*0))*p,
        154 => 15*p,
        155 => 7*p,
        157 => 13*p,
        158 => (8+(p*0))*p,
        159 => 50*p,
        160 => 7*p,
        161 => 13*p,
        210 => 7*p,
        211 => 7*p,
        212 => 7*p,
        222 => 2100+((p-30)*42),
        223 => 450+((p-30)*9),
        224 => 390+((p-30)*8),
        225 => 1500+((p-30)*30),
        _ => 0,
    };

    /// <summary>One node: the Majestic level that opens each tier and its top, and the attributes it raises.</summary>
    public sealed record Node(int Skill, int[] Tiers, int End1, int Formula1, int Formula2, AttributeDefinition[] Stats)
    {
        /// <summary>The most points the node takes at a Majestic level.</summary>
        public int Cap(int majesticLevel)
        {
            var cap = 0;
            for (var i = 0; i < this.Tiers.Length; i += 2)
            {
                if (majesticLevel >= this.Tiers[i])
                {
                    cap = this.Tiers[i + 1];
                }
            }

            return cap;
        }

        /// <summary>What the node adds at <paramref name="points"/> points.</summary>
        public float Value(int points) => points <= 0 ? 0 : MajesticStatTree.Formula(points <= this.End1 ? this.Formula1 : this.Formula2, points);
    }
}
