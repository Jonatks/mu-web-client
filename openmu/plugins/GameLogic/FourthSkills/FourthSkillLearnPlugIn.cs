// <copyright file="FourthSkillLearnPlugIn.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.FourthSkills;

using System.ComponentModel;
using System.Runtime.InteropServices;
using MUnique.OpenMU.DataModel.Configuration;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.GameLogic.Views;
using MUnique.OpenMU.Interfaces;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// A Season 19 fourth-class skill scroll teaches only a character that has the skill's base skill and its master skill
/// at level 10 (Skill/SkillRequire.xml). A master skill OpenMU does not have is not asked for.
/// </summary>
[PlugIn]
[Display(Name = "Fourth Skill Requirements", Description = "Season 19 fourth-class skill scrolls ask for their base skill and master skill.")]
[Guid("5a7c3e91-2d4b-4f6e-8a10-9b3c7d2e4f58")]
public class FourthSkillLearnPlugIn : IItemConsumingPlugIn
{
    /// <inheritdoc />
    public void ItemConsuming(Player player, Item item, Item? targetItem, CancelEventArgs eventArgs)
    {
        if (item.Definition?.Skill is not { } skill
            || !FourthSkillRequirements.Of.TryGetValue(skill.Number, out var need)
            || player.SkillList is not { } skills)
        {
            return;
        }

        var hasBase = skills.ContainsSkill((ushort)need.BaseSkill) || HasReplacing(player, need.BaseSkill);
        var master = need.MasterSkill <= 0
            || player.GameContext.Configuration.Skills.All(s => s.Number != need.MasterSkill)
            || (skills.GetSkill((ushort)need.MasterSkill)?.Level ?? 0) >= need.MasterLevel;
        if (hasBase && master)
        {
            return;
        }

        eventArgs.Cancel = true;
        var baseName = Name(player, need.BaseSkill);
        var masterName = Name(player, need.MasterSkill);
        _ = player.InvokeViewPlugInAsync<IShowMessagePlugIn>(p => p.ShowMessageAsync(
            $"Requires {baseName} and {masterName} at level {need.MasterLevel}.", MessageType.BlueNormal)).AsTask();
    }

    /// <summary>Whether the player has a master skill that replaces <paramref name="baseSkill"/> (it then casts as it).</summary>
    private static bool HasReplacing(Player player, int baseSkill)
    {
        foreach (var entry in player.SkillList!.Skills)
        {
            for (var s = entry.Skill?.MasterDefinition?.ReplacedSkill; s is not null; s = s.MasterDefinition?.ReplacedSkill)
            {
                if (s.Number == baseSkill)
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static string Name(Player player, int number) =>
        player.GameContext.Configuration.Skills.FirstOrDefault(s => s.Number == number)?.Name.ToString() ?? $"skill {number}";
}
