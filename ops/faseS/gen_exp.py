# Fase S1: la experiencia del S19 (Data/ExpSystem). La normal 1-400 es la formula de OpenMU tal cual; la master 1-200
# tambien, pero 201-400 no sigue ninguna formula, asi que va como tabla en el plugin S19MasterExperience.cs.
#   python3 ops/faseS/gen_exp.py "<Data del servidor S19>" <raiz de mu-web>
import re, sys

data, root = sys.argv[1], sys.argv[2]
def acc(name):
    return [int(v) for v in re.findall(r'AccumulatedExp="(\d+)"', open(f'{data}/ExpSystem/{name}.xml').read())]

normal, master = acc('NormalExp'), acc('MasterExp')
def nf(l):
    b = 10 * (l + 8) * (l - 1) ** 2
    return b if l < 256 else b + 1000 * (l - 247) * (l - 256) ** 2
assert all(nf(l) == v for l, v in enumerate(normal, 1)), 'la normal ya no es la formula de OpenMU'
mf = lambda l: 505 * l ** 3 + 35278500 * l + 228045 * l * l
first = next(l for l, v in enumerate(master, 1) if v != mf(l))
rows = ',\n'.join('        ' + ', '.join(str(v) for v in master[i:i + 6]) for i in range(first - 1, len(master), 6))
open(f'{root}/openmu/plugins/GameLogic/Season19/S19MasterExperience.cs', 'w').write(f"""// <copyright file="S19MasterExperience.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Season19;

using System.Runtime.InteropServices;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// The master levels {first} to {len(master)} of Season 19 (Data/ExpSystem/MasterExp.xml) follow no formula: their total
/// experience is written into the game's master table, which OpenMU builds from its formula. Made by mu-web-client
/// ops/faseS/gen_exp.py.
/// </summary>
[PlugIn]
[Display(Name = "Season 19 Master Experience", Description = "Master levels {first}-{len(master)} need the experience of Season 19.")]
[Guid("3d9e7b52-6a14-4c8f-b0e3-5f2a9c71d846")]
public class S19MasterExperience : IPlayerStateChangedPlugIn
{{
    private const int FirstLevel = {first};

    private static readonly long[] Accumulated =
    [
{rows},
    ];

    /// <inheritdoc />
    public ValueTask PlayerStateChangedAsync(Player player, State previousState, State currentState)
    {{
        // The table is rebuilt when the configuration changes, so it is checked on every login.
        if (currentState == PlayerState.Authenticated)
        {{
            Patch(player.GameContext.MasterExperienceTable);
        }}

        return ValueTask.CompletedTask;
    }}

    /// <summary>Writes the Season 19 values over the formula's (index = master level).</summary>
    public static void Patch(long[] table)
    {{
        for (var i = 0; i < Accumulated.Length && FirstLevel + i < table.Length; i++)
        {{
            table[FirstLevel + i] = Accumulated[i];
        }}

        // One past the top: what the client shows as the next level's experience.
        if (FirstLevel + Accumulated.Length < table.Length)
        {{
            table[FirstLevel + Accumulated.Length] = Accumulated[^1];
        }}
    }}
}}
""")
print('ok desde', first)
