// <copyright file="BloodangelAncientCrafting.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Craftings;

using MUnique.OpenMU.DataModel.Configuration.ItemCrafting;
using MUnique.OpenMU.DataModel.Configuration.Items;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.PlayerActions.Items;

/// <summary>
/// Bloodangel piece + Bloodangel Soul: the piece becomes the ancient item of its set (S19 mastery mix).
/// The required items, price and rate come from the crafting data (ops/bloodangel/craft.sql).
/// </summary>
public class BloodangelAncientCrafting : SimpleItemCraftingHandler
{
    /// <summary>
    /// Initializes a new instance of the <see cref="BloodangelAncientCrafting"/> class.
    /// </summary>
    /// <param name="settings">The settings.</param>
    public BloodangelAncientCrafting(SimpleCraftingSettings settings)
        : base(settings)
    {
    }

    /// <inheritdoc />
    protected override bool RequiredItemMatches(Item item, ItemCraftingRequiredItem requiredItem)
    {
        // A piece that is already ancient does not count, so the mix reports the wrong items.
        return base.RequiredItemMatches(item, requiredItem) && (requiredItem.Reference == 0 || !item.IsAncient());
    }

    /// <inheritdoc />
    protected override ValueTask<List<Item>> CreateOrModifyResultItemsAsync(IList<CraftingRequiredItemLink> requiredItems, Player player, byte socketSlot, byte successRate)
    {
        var result = new List<Item>();
        foreach (var item in requiredItems.Where(r => r.ItemRequirement.Reference > 0).SelectMany(r => r.Items))
        {
            var set = item.Definition?.PossibleItemSetGroups
                .FirstOrDefault(g => g.Options?.PossibleOptions.Any(o => object.Equals(o.OptionType, ItemOptionTypes.AncientOption)) ?? false);
            var ofSet = set?.Items.FirstOrDefault(i => object.Equals(i.ItemDefinition, item.Definition));
            if (ofSet is null)
            {
                continue;
            }

            item.ItemSetGroups.Add(ofSet);
            if (ofSet.BonusOption is { } bonus)
            {
                var link = player.PersistenceContext.CreateNew<ItemOptionLink>();
                link.ItemOption = bonus;
                link.Level = bonus.LevelDependentOptions.Select(o => o.Level).DefaultIfEmpty(1).Max();
                item.ItemOptions.Add(link);
            }

            result.Add(item);
        }

        return ValueTask.FromResult(result);
    }
}
