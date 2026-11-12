// <copyright file="AdminBridgePlugIn.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.AdminBridge;

using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using MUnique.OpenMU.GameLogic.PlugIns;
using MUnique.OpenMU.PlugIns;

/// <summary>
/// Lets the admin service see who is online and disconnect one account, through two files in a shared folder:
/// players.json (written every 2 s: login, character, map, position) and disconnect (one login name per line; read and deleted).
/// </summary>
[PlugIn]
[Display(Name = "Admin Bridge", Description = "Writes the online players to a file and disconnects the accounts named in another file.")]
[Guid("c23d400f-2d00-4404-805c-2d3d9d77da5a")]
public class AdminBridgePlugIn : IPeriodicTaskPlugIn
{
    private static readonly string Dir = Environment.GetEnvironmentVariable("MU_ADMIN_DIR") ?? "/mu-admin";
    private static readonly TimeSpan PendingFor = TimeSpan.FromSeconds(20);
    private static readonly ConcurrentDictionary<string, DateTime> Pending = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<object, (DateTime At, List<Row> Rows)> Seen = new();
    private static long lastWriteTicks;
    private static readonly object WriteLock = new();

    /// <inheritdoc />
    public async ValueTask ExecuteTaskAsync(GameContext gameContext)
    {
        try
        {
            this.ReadRequests();
            var rows = new List<Row>();
            foreach (var player in await gameContext.GetPlayersAsync().ConfigureAwait(false))
            {
                var login = player.Account?.LoginName;
                if (login is null || player.PlayerState.CurrentState.IsDisconnectedOrFinished())
                {
                    continue;
                }

                if (Pending.ContainsKey(login))
                {
                    await player.DisconnectAsync().ConfigureAwait(false);
                    gameContext.LoggerFactory.CreateLogger(this.GetType().Name).LogInformation("Admin disconnected account {Login}.", login);
                    continue;
                }

                var p = player.Position;
                rows.Add(new Row(login, player.SelectedCharacter?.Name, player.CurrentMap?.Definition.Name.ToString(), p.X, p.Y));
            }

            Seen[gameContext] = (DateTime.UtcNow, rows);
            this.WritePlayers();
        }
        catch (Exception ex)
        {
            gameContext.LoggerFactory.CreateLogger(this.GetType().Name).LogWarning(ex, "Admin bridge failed.");
        }
    }

    /// <inheritdoc />
    public void ForceStart()
    {
    }

    private void ReadRequests()
    {
        var now = DateTime.UtcNow;
        foreach (var (login, until) in Pending)
        {
            if (until < now)
            {
                Pending.TryRemove(login, out _);
            }
        }

        var file = Path.Combine(Dir, "disconnect");
        string[] lines;
        try
        {
            if (!File.Exists(file))
            {
                return;
            }

            lines = File.ReadAllLines(file, Encoding.UTF8);
            File.Delete(file);
        }
        catch (IOException)
        {
            // Another game server took it first.
            return;
        }

        foreach (var line in lines.Select(l => l.Trim()).Where(l => l.Length > 0))
        {
            Pending[line] = now + PendingFor;
        }
    }

    private void WritePlayers()
    {
        var now = DateTime.UtcNow;
        var last = Interlocked.Read(ref lastWriteTicks);
        if (now.Ticks - last < TimeSpan.FromSeconds(2).Ticks || Interlocked.CompareExchange(ref lastWriteTicks, now.Ticks, last) != last)
        {
            return;
        }

        var rows = Seen.Where(s => now - s.Value.At < TimeSpan.FromSeconds(6)).SelectMany(s => s.Value.Rows).ToList();
        var tmp = Path.Combine(Dir, "players.json.tmp");
        lock (WriteLock)
        {
            File.WriteAllText(tmp, JsonSerializer.Serialize(new { at = now, players = rows }), new UTF8Encoding(false));
            File.Move(tmp, Path.Combine(Dir, "players.json"), true);
        }
    }

    private sealed record Row(string Login, string? Character, string? Map, int X, int Y);
}
