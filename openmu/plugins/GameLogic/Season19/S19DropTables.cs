// <copyright file="S19DropTables.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.Season19;

using MUnique.OpenMU.Persistence.EntityFramework;
using Npgsql;

/// <summary>One item of a Season 19 drop bag (a row of <c>mu_plugins.s19_drop</c>).</summary>
public sealed record S19DropRow(int MonsterMinLevel, int MonsterMaxLevel, short Group, short Number, int MinLevel, int MaxLevel,
    byte Durability, int Skill, int Luck, int Option, string Exc, string Sockets, int Rate)
{
    /// <summary>Whether a monster of this level may drop it (-1 = any).</summary>
    public bool Fits(int level) => (this.MonsterMinLevel < 0 || level >= this.MonsterMinLevel) && (this.MonsterMaxLevel < 0 || level <= this.MonsterMaxLevel);
}

/// <summary>
/// The Season 19 drop tables, read once from <c>mu_plugins.s19_drop</c> and <c>mu_plugins.s19_drop_control</c>
/// (written by mu-web ops/faseS/gen_drops.py). Empty when the tables do not exist.
/// </summary>
public sealed class S19DropTables
{
    private readonly object _sync = new();
    private Task<S19DropTables?>? _loading;
    private List<S19DropRow> _all = [];
    private Dictionary<(int Map, int Monster), List<S19DropRow>> _each = [];
    private Dictionary<int, List<S19DropRow>> _set = [];
    private Dictionary<string, double> _control = [];

    private S19DropTables()
    {
    }

    /// <summary>Gets the instance.</summary>
    public static S19DropTables Instance { get; } = new();

    /// <summary>Gets a value indicating whether the tables were read and have rows.</summary>
    public bool Loaded { get; private set; }

    /// <summary>The tables, or null when there are none.</summary>
    public Task<S19DropTables?> GetAsync()
    {
        lock (this._sync)
        {
            if (this._loading is null || this._loading.IsFaulted)
            {
                this._loading = this.LoadAsync();
            }

            return this._loading;
        }
    }

    /// <summary>A rate of ItemDropRateControl.ini as a percentage.</summary>
    public int Percent(string key) => (int)this._control.GetValueOrDefault(key, 50);

    /// <summary>A setting of ItemDropRateControl.ini.</summary>
    public double Control(string key, double fallback) => this._control.GetValueOrDefault(key, fallback);

    /// <summary>Draws the drop system for one kill: the bag for this monster, or none (zen when <paramref name="zen"/>).</summary>
    public IReadOnlyList<S19DropRow>? Draw(int map, short monster, int level, out bool zen)
    {
        zen = false;
        var roll = Rand.NextInt(0, (int)this._control.GetValueOrDefault("NoItemRate", 1));
        if (roll < this._control.GetValueOrDefault("AllMonsterItemDropRate"))
        {
            return this._all.Where(r => r.Fits(level)).ToList();
        }

        if (roll < this._control.GetValueOrDefault("EachMonsterItemDropRate"))
        {
            return this._each.GetValueOrDefault((map, monster));
        }

        // The event bag depends on which events run (its EventType): not yet.
        if (roll < this._control.GetValueOrDefault("EventItemDropRate"))
        {
            return null;
        }

        if (roll < this._control.GetValueOrDefault("SetItemDropRate"))
        {
            return this._set.GetValueOrDefault(map)?.Where(r => r.Fits(level)).ToList();
        }

        zen = roll < this._control.GetValueOrDefault("ZenDropRate");
        return null;
    }

    private async Task<S19DropTables?> LoadAsync()
    {
        var connectionString = new ConfigFileDatabaseConnectionStringProvider().GetConnectionSetting(typeof(EntityDataContext)).ConnectionString;
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync().ConfigureAwait(false);
        await using (var exists = new NpgsqlCommand("SELECT to_regclass('mu_plugins.s19_drop') IS NOT NULL", connection))
        {
            if (await exists.ExecuteScalarAsync().ConfigureAwait(false) is not true)
            {
                return null;
            }
        }

        var all = new List<S19DropRow>();
        var each = new Dictionary<(int, int), List<S19DropRow>>();
        var set = new Dictionary<int, List<S19DropRow>>();
        const string sql = "SELECT system, map, monster, monster_min_level, monster_max_level, item_group, item_number, min_level, max_level, "
            + "durability, skill, luck, option, exc, sockets, rate FROM mu_plugins.s19_drop WHERE rate > 0";
        await using (var command = new NpgsqlCommand(sql, connection))
        await using (var reader = await command.ExecuteReaderAsync().ConfigureAwait(false))
        {
            while (await reader.ReadAsync().ConfigureAwait(false))
            {
                var row = new S19DropRow(reader.GetInt32(3), reader.GetInt32(4), (short)reader.GetInt32(5), (short)reader.GetInt32(6),
                    reader.GetInt32(7), reader.GetInt32(8), (byte)reader.GetInt32(9), reader.GetInt32(10), reader.GetInt32(11),
                    reader.GetInt32(12), reader.GetString(13), reader.GetString(14), reader.GetInt32(15));
                switch (reader.GetString(0))
                {
                    case "all": all.Add(row); break;
                    case "each": (each.TryGetValue((reader.GetInt32(1), reader.GetInt32(2)), out var e) ? e : each[(reader.GetInt32(1), reader.GetInt32(2))] = []).Add(row); break;
                    case "set": (set.TryGetValue(reader.GetInt32(1), out var s) ? s : set[reader.GetInt32(1)] = []).Add(row); break;
                }
            }
        }

        var control = new Dictionary<string, double>();
        await using (var command = new NpgsqlCommand("SELECT key, value FROM mu_plugins.s19_drop_control", connection))
        await using (var reader = await command.ExecuteReaderAsync().ConfigureAwait(false))
        {
            while (await reader.ReadAsync().ConfigureAwait(false))
            {
                control[reader.GetString(0)] = reader.GetDouble(1);
            }
        }

        (this._all, this._each, this._set, this._control) = (all, each, set, control);
        this.Loaded = all.Count + each.Count > 0;
        return this.Loaded ? this : null;
    }
}
