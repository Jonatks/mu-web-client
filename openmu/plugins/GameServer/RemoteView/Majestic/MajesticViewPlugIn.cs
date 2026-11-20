// <copyright file="MajesticViewPlugIn.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameServer.RemoteView.Majestic;

using System.Buffers.Binary;
using System.Reflection;
using System.Runtime.InteropServices;
using MUnique.OpenMU.GameLogic.Majestic;
using MUnique.OpenMU.GameLogic.Views.Majestic;
using MUnique.OpenMU.GameServer.MessageHandler.Marketplace;
using MUnique.OpenMU.Network;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// <c>MajesticStatus</c> (C1 E7 10): level and points (little endian), experience and experience of the next level
/// (big endian, as OpenMU's master experience), the experience the current level began at, and whether it just went up
/// a level.
/// </summary>
[PlugIn]
[Display(Name = "Majestic Status", Description = "Tells the web client the Majestic level, points and experience.")]
[Guid("2d9c41e7-8a53-4b6f-a0e2-5f17c3b9d864")]
public class MajesticViewPlugIn : IMajesticViewPlugIn
{
    private const byte SubCode = 0x10;
    private const int Size = 41;

    private static readonly PropertyInfo ConnectionProperty =
        typeof(RemotePlayer).GetProperty("Connection", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
        ?? throw new MissingMemberException(nameof(RemotePlayer), "Connection");

    private readonly RemotePlayer _player;

    /// <summary>Initializes a new instance of the <see cref="MajesticViewPlugIn"/> class.</summary>
    /// <param name="player">The player.</param>
    public MajesticViewPlugIn(RemotePlayer player) => this._player = player;

    /// <inheritdoc />
    public async ValueTask SendMajesticAsync(MajesticProgress progress, bool levelUp)
    {
        if (ConnectionProperty.GetValue(this._player) is not IConnection connection)
        {
            return;
        }

        int Write()
        {
            var span = connection.Output.GetSpan(Size)[..Size];
            span.Clear();
            span[0] = 0xC1;
            span[1] = Size;
            span[2] = MarketplaceGroupHandler.GroupKey;
            span[3] = SubCode;
            BinaryPrimitives.WriteUInt16LittleEndian(span[4..], (ushort)progress.Level);
            BinaryPrimitives.WriteUInt16LittleEndian(span[6..], (ushort)Math.Min(progress.Points, ushort.MaxValue));
            BinaryPrimitives.WriteUInt64BigEndian(span[8..], (ulong)progress.Experience);
            BinaryPrimitives.WriteUInt64BigEndian(span[16..], (ulong)progress.ExperienceOfNextLevel);
            BinaryPrimitives.WriteUInt64BigEndian(span[24..], (ulong)MajesticTable.ExperienceFor(progress.Level));
            span[32] = levelUp ? (byte)1 : (byte)0;
            for (var i = 0; i < MajesticStatTree.NodeCount; i++)
            {
                span[33 + i] = (byte)progress.StatPoints[i];
            }

            return Size;
        }

        await connection.SendAsync(Write).ConfigureAwait(false);
    }
}
