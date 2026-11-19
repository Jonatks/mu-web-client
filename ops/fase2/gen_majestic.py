# Fase 2b: la tabla de experiencia Majestic del S19 (Data/ExpSystem/MajesticExp.xml) como codigo del plugin.
#   python3 ops/fase2/gen_majestic.py "<Data del servidor S19>" > openmu/plugins/GameLogic/Majestic/MajesticTable.cs
import re, sys

rows = [(int(l), int(a)) for l, a in re.findall(r'Level="(\d+)" Exp="\d+" AccumulatedExp="(\d+)"', open(sys.argv[1] + '/ExpSystem/MajesticExp.xml', encoding='utf-8-sig').read())]
assert [l for l, _ in rows] == list(range(1, 901)), 'faltan niveles'
values = ',\n        '.join(', '.join(str(a) for _, a in rows[i:i + 6]) for i in range(0, 900, 6))
print(f"""// <copyright file="MajesticTable.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Majestic;

/// <summary>
/// The Majestic levels of Season 19 (Data/ExpSystem/MajesticExp.xml), made by mu-web-client ops/fase2/gen_majestic.py.
/// </summary>
public static class MajesticTable
{{
    /// <summary>The highest Majestic level (Common.ini LevelMajesticMax).</summary>
    public const int MaximumLevel = 900;

    /// <summary>Points per Majestic level (CharacterBase.xml MajesticLevelUpPoints).</summary>
    public const int PointsPerLevel = 1;

    /// <summary>Experience to reach level n, counted from Majestic level 0: index n - 1.</summary>
    private static readonly long[] Accumulated =
    [
        {values},
    ];

    /// <summary>The experience a character needs in total to reach <paramref name="level"/> (0 for level 0).</summary>
    public static long ExperienceFor(int level) => level <= 0 ? 0 : Accumulated[Math.Min(level, MaximumLevel) - 1];
}}""")
