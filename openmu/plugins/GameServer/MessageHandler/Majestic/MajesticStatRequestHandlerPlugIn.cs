// <copyright file="MajesticStatRequestHandlerPlugIn.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameServer.MessageHandler.Majestic;

using System.Runtime.InteropServices;
using MUnique.OpenMU.GameLogic;
using MUnique.OpenMU.GameLogic.Majestic;
using MUnique.OpenMU.GameLogic.Views.Majestic;
using MUnique.OpenMU.GameServer.MessageHandler.Marketplace;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// Spends one Majestic point on a node of the stat tree (C1 05 E7 11 node) and answers with the <c>MajesticStatus</c>.
/// </summary>
[PlugIn]
[Display(Name = "Majestic Stat Request Handler", Description = "Spends a Majestic point on a node of the Season 19 stat tree.")]
[Guid("8e1f6c27-4b9a-4d03-a5e8-7c2d1b0f9a46")]
[BelongsToGroup(MarketplaceGroupHandler.GroupKey)]
internal class MajesticStatRequestHandlerPlugIn : ISubPacketHandlerPlugIn
{
    /// <inheritdoc />
    public bool IsEncryptionExpected => false;

    /// <inheritdoc />
    public byte Key => 0x11;

    /// <inheritdoc />
    public async ValueTask HandlePacketAsync(Player player, Memory<byte> packet)
    {
        if (packet.Length < 5 || player.PlayerState.CurrentState != PlayerState.EnteredWorld
            || await MajesticExperiencePlugIn.GetAsync(player).ConfigureAwait(false) is not { } progress)
        {
            return;
        }

        if (MajesticStats.Spend(player, progress, packet.Span[4]))
        {
            await MajesticStore.Instance.SaveAsync(progress).ConfigureAwait(false);
            progress.SavedAt = DateTime.UtcNow;
        }

        await player.InvokeViewPlugInAsync<IMajesticViewPlugIn>(p => p.SendMajesticAsync(progress, false)).ConfigureAwait(false);
    }
}
