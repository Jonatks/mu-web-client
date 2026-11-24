// <copyright file="S19Drops.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Season19;

using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using MUnique.OpenMU.DataModel;
using MUnique.OpenMU.DataModel.Configuration;
using MUnique.OpenMU.DataModel.Configuration.Items;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.Attributes;
using MUnique.OpenMU.GameLogic.NPC;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// The item drops of Season 19 (Data/Item/Drop): each kill draws one system by ItemDropRateControl.ini (all-monster bag,
/// the monster's bag on its map, event bag, set bag, zen, nothing), then one item of that bag by its rate out of
/// 1000000. The tables are <c>mu_plugins.s19_drop</c>; without them OpenMU drops as before. OpenMU's random equipment and
/// jewels are then not dropped; its boxes, quest items and zen still are.
/// </summary>
[PlugIn]
[Display(Name = "Season 19 Drops", Description = "Monsters drop what the Season 19 bags say (mu_plugins.s19_drop).")]
[Guid("b84f2e17-5c3a-4d69-9e21-7a0c6d3f58b4")]
public class S19Drops : IAttackableGotKilledPlugIn, IMonsterItemDropPlugIn
{
    private const int BagBasis = 1000000;

    /// <inheritdoc />
    public void ItemDropping(AttackableNpcBase monster, Player killer, Item item, CancelEventArgs eventArgs)
    {
        if (S19DropTables.Instance.Loaded && IsGeneric(item.Definition))
        {
            eventArgs.Cancel = true;
        }
    }

    /// <inheritdoc />
    public async ValueTask AttackableGotKilledAsync(IAttackable killed, IAttacker? killer)
    {
        if (killed is not Monster { SummonedBy: null } monster || monster.Definition.ObjectKind != NpcObjectKind.Monster
            || (killer as Player ?? (killer as Monster)?.SummonedBy) is not { } player)
        {
            return;
        }

        try
        {
            var tables = await S19DropTables.Instance.GetAsync().ConfigureAwait(false);
            if (tables is null)
            {
                return;
            }

            var map = monster.CurrentMap;
            var level = (int)monster.Definition[Stats.Level];
            var bag = tables.Draw(map.MapId, monster.Definition.Number, level);
            if (bag is null || Choose(bag) is not { } row
                || player.GameContext.Configuration.Items.FirstOrDefault(d => d.Group == row.Group && d.Number == row.Number) is not { } definition)
            {
                return;
            }

            var item = Create(definition, row, tables);
            var owners = player.Party?.PartyList.AsEnumerable() ?? player.GetAsEnumerable();
            await map.AddAsync(new DroppedItem(item, monster.Position, map, null, owners)).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            player.Logger.LogError(ex, "Season 19 drop of {0} failed.", monster.Definition.Designation);
        }
    }

    /// <summary>Weapons, armour and jewels: what OpenMU picks at random by monster level.</summary>
    private static bool IsGeneric(ItemDefinition? definition) => definition is { Group: <= 11 }
        || definition is { Group: 14, Number: 13 or 14 or 16 or 22 or 31 or 42 } or { Group: 12, Number: 15 };

    private static S19DropRow? Choose(IReadOnlyList<S19DropRow> bag)
    {
        var roll = Rand.NextInt(0, BagBasis);
        foreach (var row in bag)
        {
            roll -= row.Rate;
            if (roll < 0)
            {
                return row;
            }
        }

        return null;
    }

    private static Item Create(ItemDefinition definition, S19DropRow row, S19DropTables tables)
    {
        var item = new TemporaryItem { Definition = definition };
        item.Level = (byte)Math.Min(Rand.NextInt(row.MinLevel, row.MaxLevel + 1), definition.MaximumItemLevel);
        var excellent = row.Exc != "-1";
        if (item.CanHaveSkill() && (row.Skill == 1 || (row.Skill == -1 && Rand.NextRandomBool(tables.Percent(excellent ? "ExcItemSkillRate" : "ItemSkillRate")))))
        {
            item.HasSkill = true;
        }

        if (row.Luck == 1 || (row.Luck == -1 && Rand.NextRandomBool(tables.Percent(excellent ? "ExcItemLuckRate" : "ItemLuckRate"))))
        {
            AddOption(item, ItemOptionTypes.Luck, 0);
        }

        var optionLevel = row.Option switch
        {
            > 0 => row.Option,
            -1 => Rand.NextInt(0, 5),
            -2 => Rand.NextInt(0, 4),
            _ => 0,
        };
        if (optionLevel > 0)
        {
            AddOption(item, ItemOptionTypes.Option, optionLevel);
        }

        if (excellent)
        {
            AddExcellent(item, row.Exc);
        }

        if (definition.MaximumSockets > 0)
        {
            var sockets = row.Sockets.Split(';').Select(int.Parse).ToArray();
            item.SocketCount = sockets is [> 0, var max]
                ? Math.Min(Rand.NextInt(sockets[0], max + 1), definition.MaximumSockets)
                : Rand.NextInt(1, definition.MaximumSockets + 1);
        }

        item.Durability = row.Durability > 0 ? row.Durability : item.GetMaximumDurabilityOfOnePiece();
        return item;
    }

    private static void AddOption(Item item, ItemOptionType type, int level)
    {
        if (item.Definition!.PossibleItemOptions.SelectMany(o => o.PossibleOptions).FirstOrDefault(o => o.OptionType == type) is { } option)
        {
            item.ItemOptions.Add(new ItemOptionLink { ItemOption = option, Level = level });
        }
    }

    /// <summary>-2 random options, "-3;X" X random options, -10 (mastery) like -2, or the S19 option ids (0-5 = OpenMU 1-6).</summary>
    private static void AddExcellent(Item item, string exc)
    {
        var options = item.Definition!.PossibleItemOptions.SelectMany(o => o.PossibleOptions)
            .Where(o => o.OptionType == ItemOptionTypes.Excellent).ToList();
        if (options.Count == 0)
        {
            return;
        }

        var parts = exc.Split(';').Select(int.Parse).ToArray();
        IEnumerable<IncreasableItemOption> chosen = parts switch
        {
            [-3, var count] => options.OrderBy(_ => Rand.NextInt(0, 1000)).Take(count),
            [< 0, ..] => options.OrderBy(_ => Rand.NextInt(0, 1000)).Take(RandomCount()),
            _ => options.Where(o => parts.Contains(o.Number - 1)),
        };
        foreach (var option in chosen)
        {
            item.ItemOptions.Add(new ItemOptionLink { ItemOption = option });
        }

        static int RandomCount()
        {
            var count = 1;
            while (count < 6 && Rand.NextRandomBool(25))
            {
                count++;
            }

            return count;
        }
    }
}
