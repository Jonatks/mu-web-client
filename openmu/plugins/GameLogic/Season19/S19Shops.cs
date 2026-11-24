// <copyright file="S19Shops.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Season19;

using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using MUnique.OpenMU.DataModel.Configuration;
using MUnique.OpenMU.DataModel.Configuration.Items;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.Persistence.EntityFramework;
using MUnique.OpenMU.PlugIns;
using Npgsql;

/// <summary>
/// The NPC shops of Season 19 (Data/Shops): <c>mu_plugins.s19_shop</c> (mu-web ops/faseS/gen_shops.py) is put into the
/// merchant stores of the loaded configuration once, at the first login: tab 1 is the store, tabs 2 to 5 are kept in
/// <see cref="Pages"/> for <see cref="S19ShopPages"/>. Nothing is written to the database: without the table, or with
/// the plugin off, the stores stay OpenMU's. NPCs without a store keep none.
/// </summary>
[PlugIn]
[Display(Name = "Season 19 Shops", Description = "NPC shops sell what the Season 19 shops sell (mu_plugins.s19_shop).")]
[Guid("e2a7c94d-1f36-4b58-8d0e-6c3b9a5f2e71")]
public class S19Shops : IPlayerStateChangedPlugIn
{
    private const int Columns = 8;
    private const int Rows = 15;
    private static readonly SemaphoreSlim Once = new(1, 1);
    private static bool done;

    /// <summary>Gets the tabs after the first of each merchant (NPC number): tab 2 first, each laid out like the store.</summary>
    public static IReadOnlyDictionary<short, List<List<Item>>> Pages { get; private set; } = new Dictionary<short, List<List<Item>>>();

    /// <inheritdoc />
    public async ValueTask PlayerStateChangedAsync(Player player, State previousState, State currentState)
    {
        if (done || currentState != PlayerState.Authenticated)
        {
            return;
        }

        await Once.WaitAsync().ConfigureAwait(false);
        try
        {
            if (!done)
            {
                var count = await ApplyAsync(player.GameContext.Configuration).ConfigureAwait(false);
                player.Logger.LogInformation("Season 19 shops: {0} NPC stores filled.", count);
                done = true;
            }
        }
        catch (Exception ex)
        {
            player.Logger.LogError(ex, "Season 19 shops could not be applied.");
            done = true;
        }
        finally
        {
            Once.Release();
        }
    }

    private static async Task<int> ApplyAsync(GameConfiguration config)
    {
        var connectionString = new ConfigFileDatabaseConnectionStringProvider().GetConnectionSetting(typeof(EntityDataContext)).ConnectionString;
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync().ConfigureAwait(false);
        await using (var exists = new NpgsqlCommand("SELECT to_regclass('mu_plugins.s19_shop') IS NOT NULL", connection))
        {
            if (await exists.ExecuteScalarAsync().ConfigureAwait(false) is not true)
            {
                return 0;
            }
        }

        var rows = new List<(int Npc, int Tab, int Group, int Number, int Level, int Durability, int Skill, int Luck, int Option, string Exc)>();
        const string sql = "SELECT npc, tab, item_group, item_number, level, durability, skill, luck, option, exc FROM mu_plugins.s19_shop ORDER BY npc, tab, seq";
        await using (var command = new NpgsqlCommand(sql, connection))
        await using (var reader = await command.ExecuteReaderAsync().ConfigureAwait(false))
        {
            while (await reader.ReadAsync().ConfigureAwait(false))
            {
                rows.Add((reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3), reader.GetInt32(4),
                    reader.GetInt32(5), reader.GetInt32(6), reader.GetInt32(7), reader.GetInt32(8), reader.GetString(9)));
            }
        }

        var filled = 0;
        var pages = new Dictionary<short, List<List<Item>>>();
        foreach (var shop in rows.GroupBy(r => r.Npc))
        {
            if (config.Monsters.FirstOrDefault(m => m.Number == shop.Key)?.MerchantStore is not { } store)
            {
                continue;
            }

            foreach (var tab in shop.GroupBy(r => r.Tab).OrderBy(t => t.Key))
            {
                var grid = new bool[Columns, Rows];
                var items = new List<Item>();
                foreach (var row in tab)
                {
                    if (config.Items.FirstOrDefault(d => d.Group == row.Group && d.Number == row.Number) is not { } definition
                        || Place(grid, Math.Max((int)definition.Width, 1), Math.Max((int)definition.Height, 1)) is not { } slot)
                    {
                        continue;
                    }

                    items.Add(Create(definition, row.Level, row.Durability, row.Skill, row.Luck, row.Option, row.Exc, slot));
                }

                if (tab.Key == 1)
                {
                    store.Items.Clear();
                    items.ForEach(store.Items.Add);
                }
                else if (items.Count > 0)
                {
                    (pages.TryGetValue((short)shop.Key, out var list) ? list : pages[(short)shop.Key] = []).Add(items);
                }
            }

            filled++;
        }

        Pages = pages;
        return filled;
    }

    /// <summary>The first free spot, row by row, as the store slot (row * 8 + column); null when the page is full.</summary>
    private static byte? Place(bool[,] grid, int width, int height)
    {
        for (var y = 0; y + height <= Rows; y++)
        {
            for (var x = 0; x + width <= Columns; x++)
            {
                var free = true;
                for (var i = 0; i < width && free; i++)
                {
                    for (var j = 0; j < height && free; j++)
                    {
                        free = !grid[x + i, y + j];
                    }
                }

                if (!free)
                {
                    continue;
                }

                for (var i = 0; i < width; i++)
                {
                    for (var j = 0; j < height; j++)
                    {
                        grid[x + i, y + j] = true;
                    }
                }

                return (byte)((y * Columns) + x);
            }
        }

        return null;
    }

    private static Item Create(ItemDefinition definition, int level, int durability, int skill, int luck, int option, string exc, byte slot)
    {
        var item = new TemporaryItem { Definition = definition, ItemSlot = slot, Level = (byte)Math.Min(level, definition.MaximumItemLevel) };
        item.HasSkill = skill == 1 && definition.Skill is not null;
        var options = definition.PossibleItemOptions.SelectMany(o => o.PossibleOptions).ToList();
        if (luck == 1 && options.FirstOrDefault(o => o.OptionType == ItemOptionTypes.Luck) is { } luckOption)
        {
            item.ItemOptions.Add(new ItemOptionLink { ItemOption = luckOption });
        }

        if (option > 0 && options.FirstOrDefault(o => o.OptionType == ItemOptionTypes.Option) is { } normal)
        {
            item.ItemOptions.Add(new ItemOptionLink { ItemOption = normal, Level = option });
        }

        if (exc != "-1")
        {
            var ids = exc.Split(';').Select(int.Parse).ToHashSet();
            foreach (var excellent in options.Where(o => o.OptionType == ItemOptionTypes.Excellent && ids.Contains(o.Number - 1)))
            {
                item.ItemOptions.Add(new ItemOptionLink { ItemOption = excellent });
            }
        }

        item.Durability = durability > 0 ? durability : item.GetMaximumDurabilityOfOnePiece();
        return item;
    }
}
