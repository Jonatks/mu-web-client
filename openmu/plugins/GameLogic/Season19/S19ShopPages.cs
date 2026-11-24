// <copyright file="S19ShopPages.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Season19;

using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using MUnique.OpenMU.DataModel.Configuration.Items;
using MUnique.OpenMU.DataModel.Entities;
using MUnique.OpenMU.GameLogic.Modules;
using MUnique.OpenMU.GameLogic.NPC;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.GameLogic.Views.Modules;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// The tabs 2 to 5 of the Season 19 shops (<see cref="S19Shops.Pages"/>), for the client module <c>npc_shop</c> (its pages.ts).
/// Payloads from the client: <c>0</c> asks for the open merchant's pages; <c>1, page, slot</c> picks the item the next
/// buy of this merchant gets (page 2 is 0). The answer to <c>0</c> is <c>0, count</c> and, per page, <c>n</c> and n
/// items of 9 bytes: slot, group, number (2, little endian), level, durability, skill + luck * 2, option level,
/// excellent bits. The buy itself is OpenMU's (C1 32, any slot of the first tab), with the picked item as its
/// replacement (<see cref="INpcItemPurchasePlugIn"/>).
/// </summary>
[PlugIn]
[Display(Name = "Season 19 Shop Pages", Description = "The second to fifth tab of the Season 19 shops (client module npc_shop).")]
[Guid("5a8e3f12-9c47-4b6d-8e21-f3a7c0d94b58")]
public class S19ShopPages : IModulePacketPlugIn, INpcItemPurchasePlugIn
{
    private const string ModuleId = "npc_shop";
    private static readonly ConcurrentDictionary<Player, (short Npc, Item Item)> Picked = new();
    private readonly ItemPriceCalculator _prices = new();

    /// <inheritdoc />
    public string Key => ModuleId;

    /// <inheritdoc />
    public async ValueTask HandlePacketAsync(Player player, ReadOnlyMemory<byte> payload)
    {
        if (payload.Length == 0 || player.OpenedNpc?.Definition is not { } npc)
        {
            return;
        }

        var pages = S19Shops.Pages.GetValueOrDefault(npc.Number);
        switch (payload.Span[0])
        {
            case 0:
                await player.InvokeViewPlugInAsync<IModulePacketViewPlugIn>(p => p.SendModulePacketAsync(ModuleId, Encode(pages))).ConfigureAwait(false);
                break;
            case 1 when payload.Length >= 3 && pages is not null && payload.Span[1] < pages.Count:
                var slot = payload.Span[2];
                if (pages[payload.Span[1]].FirstOrDefault(i => i.ItemSlot == slot) is { } item)
                {
                    Picked[player] = (npc.Number, item);
                }

                break;
        }
    }

    /// <inheritdoc />
    public ValueTask BeforePurchaseAsync(Player player, NonPlayerCharacter merchant, NpcItemPurchaseArgs eventArgs)
    {
        if (Picked.TryRemove(player, out var picked) && picked.Npc == merchant.Definition.Number)
        {
            eventArgs.ReplacementItem = picked.Item;
            eventArgs.Price = this._prices.CalculateFinalBuyingPrice(picked.Item);
        }

        return ValueTask.CompletedTask;
    }

    /// <inheritdoc />
    public ValueTask AfterPurchaseAsync(Player player, NonPlayerCharacter merchant, NpcItemPurchaseArgs eventArgs, Item boughtItem) => ValueTask.CompletedTask;

    private static byte[] Encode(List<List<Item>>? pages)
    {
        pages ??= [];
        var bytes = new List<byte> { 0, (byte)pages.Count };
        foreach (var page in pages)
        {
            bytes.Add((byte)page.Count);
            foreach (var item in page)
            {
                var number = item.Definition!.Number;
                var option = item.ItemOptions.FirstOrDefault(o => o.ItemOption?.OptionType == ItemOptionTypes.Option)?.Level ?? 0;
                var luck = item.ItemOptions.Any(o => o.ItemOption?.OptionType == ItemOptionTypes.Luck);
                var excellent = item.ItemOptions.Where(o => o.ItemOption?.OptionType == ItemOptionTypes.Excellent)
                    .Aggregate(0, (bits, o) => bits | (1 << (o.ItemOption!.Number - 1)));
                bytes.AddRange([
                    item.ItemSlot, (byte)item.Definition.Group, (byte)number, (byte)(number >> 8), item.Level,
                    (byte)item.Durability, (byte)((item.HasSkill ? 1 : 0) | (luck ? 2 : 0)), (byte)option, (byte)(excellent & 0x3f),
                ]);
            }
        }

        return [.. bytes];
    }
}
