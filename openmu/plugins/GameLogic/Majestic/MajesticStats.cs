// <copyright file="MajesticStats.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Majestic;

using System.Runtime.CompilerServices;
using MUnique.OpenMU.AttributeSystem;

/// <summary>
/// The Majestic stat tree on a character: one element per node and attribute, added to the attribute system the
/// character enters the world with, and spending a point on a node.
/// </summary>
public static class MajesticStats
{
    private static readonly ConditionalWeakTable<IAttributeSystem, SimpleElement[]> Applied = new();

    /// <summary>Adds the tree's elements to the player's attributes (once per attribute system) and sets their values.</summary>
    public static void Apply(Player player, MajesticProgress progress)
    {
        if (player.Attributes is not { } attributes || MajesticStatTree.Of(player.SelectedCharacter?.CharacterClass?.Number ?? 255) is not { } nodes)
        {
            return;
        }

        var elements = Applied.GetValue(attributes, a =>
        {
            var created = new SimpleElement[nodes.Length];
            for (var i = 0; i < nodes.Length; i++)
            {
                created[i] = new SimpleElement(0, AggregateType.AddRaw);
                foreach (var stat in nodes[i].Stats)
                {
                    a.AddElement(created[i], stat);
                }
            }

            return created;
        });

        for (var i = 0; i < nodes.Length; i++)
        {
            elements[i].Value = nodes[i].Value(progress.StatPoints[i]);
        }
    }

    /// <summary>Spends one point on a node when the level opens it and a point is left. Returns whether it did.</summary>
    public static bool Spend(Player player, MajesticProgress progress, int node)
    {
        if (MajesticStatTree.Of(player.SelectedCharacter?.CharacterClass?.Number ?? 255) is not { } nodes
            || node < 0 || node >= nodes.Length || progress.Points <= 0
            || progress.StatPoints[node] >= nodes[node].Cap(progress.Level))
        {
            return false;
        }

        progress.Points--;
        progress.StatPoints[node]++;
        Apply(player, progress);
        return true;
    }
}
